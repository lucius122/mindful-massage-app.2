import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dqivaotpkldglxdobkvn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxaXZhb3Rwa2xkZ2x4ZG9ia3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzg4MDgsImV4cCI6MjA5NDYxNDgwOH0.JmvrPS9EK0cGO3J9PytV6kupnZ3Se1iK9AULqHptW8Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const { data: logs, error: logsError } = await supabase.from("booking_logs").select("*");
  console.log("Logs:", logsError ? logsError : logs);
  
  const { data: bookings, error: bookingsError } = await supabase.from("bookings").select("*");
  console.log("Bookings:", bookingsError ? bookingsError : bookings);
}

check();
