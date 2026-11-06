'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {LayoutDashboard,Dumbbell,ClipboardList,ChartNoAxesColumn,LogOut} from 'lucide-react';
import {createClient} from '@/lib/supabase/client';
const links=[{href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},{href:'/dashboard/workouts',label:'Workouts',icon:Dumbbell},{href:'/dashboard/routines',label:'Routines',icon:ClipboardList},{href:'/dashboard/progress',label:'Progress',icon:ChartNoAxesColumn}];
export function Sidebar(){const pathname=usePathname();const router=useRouter();async function logout(){const {error}=await createClient().auth.signOut();if(error){window.alert(error.message);return;}router.replace('/login');router.refresh();}
return <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-6"><Link href="/dashboard" className="text-2xl font-bold text-blue-600">FitTrack</Link><nav aria-label="Main navigation" className="mt-6 flex gap-2 overflow-x-auto md:mt-10 md:flex-col">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium '+(pathname===href||(href!='/dashboard'&&pathname.startsWith(href+'/'))?'bg-blue-50 text-blue-600':'text-slate-500 hover:bg-slate-50')}><Icon size={20}/>{label}</Link>)}</nav><button onClick={logout} className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"><LogOut size={20}/>Sign out</button></aside>}
