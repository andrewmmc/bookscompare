-- BooksCompare account deletion RPC
-- Apple requires in-app account deletion. This SECURITY DEFINER function lets a
-- signed-in user delete their own auth.users row; the ON DELETE CASCADE foreign
-- keys on history_entries and favourites remove their synced data automatically.
-- Run against the Supabase project (SQL editor or `supabase db push`).

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
