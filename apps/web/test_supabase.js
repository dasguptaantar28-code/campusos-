const { createClient } = require('@supabase/supabase-js');
const client = createClient('https://nlmzdgubcztxpcrfqkfs.supabase.co', 'sb_publishable_wWoejie1mDRQSsJg71quzw_jsoTdxqA');

async function test() {
  const { data, error } = await client.from('registrations').select('*').limit(5);
  console.log('registrations query:', { count: data ? data.length : 0, error: error?.message, data });
  const { data: tenants, error: tErr } = await client.from('tenants').select('id, name, slug').limit(5);
  console.log('tenants query:', { count: tenants ? tenants.length : 0, error: tErr?.message, tenants });
}
test();
