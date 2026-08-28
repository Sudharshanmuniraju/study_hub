/*
# Revoke public execute on handle_new_user

The `handle_new_user()` SECURITY DEFINER function is a trigger fired by
`on_auth_user_created` on `auth.users`. It should NOT be callable directly via
the REST API by anon or authenticated roles. Revoke EXECUTE from both roles
and grant it only to the postgres internal role (which runs triggers).
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
