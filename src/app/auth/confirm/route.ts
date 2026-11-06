import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(request:NextRequest){const url=new URL(request.url);const hash=url.searchParams.get('token_hash');const type=url.searchParams.get('type');if(hash&&type==='email'){const supabase=await createClient();const {error}=await supabase.auth.verifyOtp({token_hash:hash,type:'email'});if(!error)return NextResponse.redirect(new URL('/dashboard',url.origin));}return NextResponse.redirect(new URL('/login?error=confirmation',url.origin));}
