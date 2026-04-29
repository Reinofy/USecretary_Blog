const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://croheciuxhtifejhcwws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2hlY2l1eGh0aWZlamhjd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYxNTgsImV4cCI6MjA4NjEyMjE1OH0.Fqt9ushsPnS6iQX7oGjeFtKfxyIK5iyVEBY5HCa5d1c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.from('blog_posts').select('*').limit(1);
  if (error) {
    console.error('Error fetching blog_posts:', error);
  } else {
    console.log('Successfully connected to blog_posts table! Data:', data);
  }
}

test();
