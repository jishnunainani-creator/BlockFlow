const { createClient } = require('@supabase/supabase-js');

const url = 'https://wdbvwtolhfjmkogxxeyy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnZ3dG9saGZqbWtvZ3h4ZXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTEyOTQsImV4cCI6MjEwMDk4NzI5NH0.uoqloV4AUCkhGfGDbCRoQFcpCduDjrh8xI0IiHZFj_Y';

const supabase = createClient(url, key);

const libraryBlocks = [
  { block_id: 'block-1785181271512', title: 'Fitness', description: 'Gym,Cricket,Pickleball,TT.', priority: 'Fitness', color: '#64748B', default_duration: 90, icon: 'code' },
  { block_id: 'block-1785180693019', title: 'Self Study', description: 'Self Study', priority: 'high', color: '#EC4899', default_duration: 60, icon: 'code' },
  { block_id: 'block-1785180426499', title: 'WAKE UP', description: 'WAKE UP', priority: 'high', color: '#EC4899', default_duration: 30, icon: 'code' },
  { block_id: 'block-1785180327130', title: 'LUNCH BREAK', description: 'Lunch', priority: 'medium', color: '#EF4444', default_duration: 30, icon: 'coffee' },
  { block_id: 'block-1785180171203', title: 'ENR215 SEC-2', description: 'ENR215 SEC-2', priority: 'medium', color: '#F97316', default_duration: 240, icon: 'code' },
  { block_id: 'block-1785179966798', title: 'ENR207 SEC-2', description: 'ENR207 SEC-2', priority: 'medium', color: '#10B981', default_duration: 90, icon: 'brain' },
  { block_id: 'block-1785179761029', title: 'MGT111 SEC-2', description: 'SEC-2 Identity and Behaviour', priority: 'medium', color: '#F97316', default_duration: 90, icon: 'brain' },
  { block_id: 'block-1785179503902', title: 'CSE305 SEC-1', description: 'CSE305 SEC-1(Data Structure and Algorithms)', priority: 'medium', color: '#8B5CF6', default_duration: 90, icon: 'code' },
  { block_id: 'block-1785179085804', title: 'ENR209 SEC-2', description: 'ENR209 SEC-2', priority: 'medium', color: '#F97316', default_duration: 90, icon: 'brain' },
  { block_id: 'block-1785178924907', title: 'ENR211 SEC-2', description: 'ENR211 SEC-2', priority: 'medium', color: '#10B981', default_duration: 90, icon: 'brain' },
  { block_id: 'block-1785178488270', title: 'CSE 213 SEC-1', description: 'CSE 213 SEC-1', priority: 'medium', color: '#06B6D4', default_duration: 90, icon: 'code' },
  { block_id: 'block-dsa', title: 'DSA Practice', description: 'LeetCode problem solving', priority: 'high', color: '#EF4444', default_duration: 90, icon: 'code' },
  { block_id: 'block-internship', title: 'Internship Work', description: 'Sprint tasks', priority: 'high', color: '#F97316', default_duration: 120, icon: 'briefcase' },
  { block_id: 'block-gym', title: 'Gym & Workout', description: 'Fitness', priority: 'personal', color: '#3B82F6', default_duration: 60, icon: 'dumbbell' },
  { block_id: 'block-cat', title: 'CAT Preparation', description: 'QA mock tests', priority: 'high', color: '#EC4899', default_duration: 60, icon: 'target' },
];

async function syncAll() {
  console.log('Uploading activity library blocks...');
  const resLib = await supabase.from('activity_library').insert(libraryBlocks);
  console.log('Activity Library Insert Result:', resLib);
}

syncAll();
