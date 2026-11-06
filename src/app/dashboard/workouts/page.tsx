import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

async function createWorkout(formData: FormData) {
  "use server";
  const { supabase, user } = await authenticatedClient();
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name || name.length > 100 || notes.length > 1000) {
    throw new Error("Enter a workout name (1–100 characters) and notes up to 1000 characters.");
  }
  const { error } = await supabase.from("workouts").insert({
    user_id: user.id, name, notes: notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workouts");
}

async function addExercise(formData: FormData) {
  "use server";
  const { supabase, user } = await authenticatedClient();
  const workoutId = String(formData.get("workout_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 100) throw new Error("Enter an exercise name (1–100 characters).");
  const { data: workout, error: ownershipError } = await supabase
    .from("workouts").select("id").eq("id", workoutId).eq("user_id", user.id).single();
  if (ownershipError || !workout) throw new Error("Workout not found.");
  const { error } = await supabase.from("exercises").insert({ workout_id: workoutId, name });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workouts");
}

async function addSet(formData: FormData) {
  "use server";
  const { supabase, user } = await authenticatedClient();
  const exerciseId = String(formData.get("exercise_id") ?? "");
  const reps = Number(formData.get("reps"));
  const weightKg = Number(formData.get("weight_kg"));
  if (!Number.isInteger(reps) || reps < 0 || reps > 10000 ||
      !Number.isFinite(weightKg) || weightKg < 0 || weightKg > 999999.99) {
    throw new Error("Enter valid reps and weight.");
  }
  const { data: exercise, error: ownershipError } = await supabase
    .from("exercises")
    .select("id, workouts!inner(user_id)")
    .eq("id", exerciseId)
    .eq("workouts.user_id", user.id)
    .single();
  if (ownershipError || !exercise) throw new Error("Exercise not found.");
  const { data: previousSets, error: setsError } = await supabase
    .from("exercise_sets").select("set_number")
    .eq("exercise_id", exerciseId)
    .order("set_number", { ascending: false }).limit(1);
  if (setsError) throw new Error(setsError.message);
  const setNumber = (previousSets?.[0]?.set_number ?? 0) + 1;
  const { error } = await supabase.from("exercise_sets").insert({
    exercise_id: exerciseId, set_number: setNumber, reps, weight_kg: weightKg, completed: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workouts");
}

async function deleteWorkout(formData: FormData) {
  "use server";
  const { supabase, user } = await authenticatedClient();
  const workoutId = String(formData.get("workout_id") ?? "");
  const { error } = await supabase.from("workouts")
    .delete().eq("id", workoutId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workouts");
}

type SetRow = { id: string; exercise_id: string; set_number: number; reps: number; weight_kg: number; completed: boolean };
type ExerciseRow = { id: string; workout_id: string; name: string };
type WorkoutRow = { id: string; name: string; notes: string | null; workout_date: string };

export default async function WorkoutsPage() {
  const { supabase, user } = await authenticatedClient();
  const { data: workouts, error: workoutError } = await supabase
    .from("workouts").select("id, name, notes, workout_date")
    .eq("user_id", user.id).order("workout_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (workoutError) return <p className="text-red-600">Could not load workouts: {workoutError.message}</p>;

  const workoutRows = (workouts ?? []) as WorkoutRow[];
  const workoutIds = workoutRows.map((workout) => workout.id);
  let exercises: ExerciseRow[] = [];
  let sets: SetRow[] = [];

  if (workoutIds.length > 0) {
    const { data, error } = await supabase.from("exercises")
      .select("id, workout_id, name").in("workout_id", workoutIds)
      .order("position", { ascending: true }).order("created_at", { ascending: true });
    if (error) return <p className="text-red-600">Could not load exercises: {error.message}</p>;
    exercises = (data ?? []) as ExerciseRow[];
    if (exercises.length > 0) {
      const { data: setData, error: setError } = await supabase.from("exercise_sets")
        .select("id, exercise_id, set_number, reps, weight_kg, completed")
        .in("exercise_id", exercises.map((exercise) => exercise.id))
        .order("set_number", { ascending: true });
      if (setError) return <p className="text-red-600">Could not load sets: {setError.message}</p>;
      sets = (setData ?? []) as SetRow[];
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
  const buttonClass = "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">My Workouts</h1>
        <p className="mt-2 text-slate-500">Log exercises, sets, reps, and weight. Your data is saved in Supabase.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Create a workout</h2>
        <form action={createWorkout} className="space-y-3">
          <input name="name" aria-label="Workout name" placeholder="Workout name (e.g. Push Day)"
            required maxLength={100} className={inputClass} />
          <textarea name="notes" aria-label="Workout notes" placeholder="Notes (optional)"
            maxLength={1000} rows={2} className={inputClass} />
          <button type="submit" className={buttonClass}>Save workout</button>
        </form>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Workout history</h2>
        {workoutRows.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
            No workouts yet. Create your first workout above.
          </p>
        )}
        {workoutRows.map((workout) => (
          <article key={workout.id} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{workout.name}</h3>
                <p className="text-sm text-slate-500">{workout.workout_date}</p>
                {workout.notes && <p className="mt-2 text-sm text-slate-600">{workout.notes}</p>}
              </div>
              <form action={deleteWorkout}>
                <input type="hidden" name="workout_id" value={workout.id} />
                <button type="submit" className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                  Delete workout
                </button>
              </form>
            </div>

            {exercises.filter((exercise) => exercise.workout_id === workout.id).map((exercise) => (
              <div key={exercise.id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="font-semibold text-slate-900">{exercise.name}</h4>
                <div className="mt-3 space-y-1">
                  {sets.filter((set) => set.exercise_id === exercise.id).map((set) => (
                    <p key={set.id} className="text-sm text-slate-700">
                      Set {set.set_number}: {set.reps} reps × {set.weight_kg} kg
                    </p>
                  ))}
                </div>
                <form action={addSet} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="exercise_id" value={exercise.id} />
                  <label className="w-24 text-xs text-slate-600">Reps
                    <input type="number" name="reps" min="0" max="10000" defaultValue="10"
                      required className={inputClass} />
                  </label>
                  <label className="w-28 text-xs text-slate-600">Weight (kg)
                    <input type="number" name="weight_kg" min="0" max="999999.99" step="0.01"
                      defaultValue="0" required className={inputClass} />
                  </label>
                  <button type="submit" className={buttonClass}>Add set</button>
                </form>
              </div>
            ))}

            <form action={addExercise} className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="workout_id" value={workout.id} />
              <input name="name" aria-label="Exercise name" placeholder="Exercise (e.g. Bench Press)"
                required maxLength={100} className={inputClass + " min-w-40 flex-1"} />
              <button type="submit" className={buttonClass}>Add exercise</button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
