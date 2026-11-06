import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {Sidebar} from '@/components/dashboard/sidebar';
export default async function DashboardLayout({children}:{children:React.ReactNode}){const supabase=await createClient();const {data,error}=await supabase.auth.getClaims();if(error||!data?.claims)redirect('/login');return <div className="min-h-screen bg-slate-50 text-slate-900 md:flex"><Sidebar/><main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">{children}</main></div>}
