-- Mock Data for Kingdom Family Platform Demo
-- Run in Supabase SQL Editor: Dashboard → SQL → New query → paste → Run

-- Insert Mock Speakers
INSERT INTO public.speakers (id, name, avatar_url, is_active, created_at) VALUES
  (gen_random_uuid(), 'Pastor John Doe', 'https://api.dicebear.com/7.x/initials/svg?seed=JD', true, NOW()),
  (gen_random_uuid(), 'Pastor Jane Smith', 'https://api.dicebear.com/7.x/initials/svg?seed=JS', true, NOW()),
  (gen_random_uuid(), 'Pastor Michael Johnson', 'https://api.dicebear.com/7.x/initials/svg?seed=MJ', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert Mock Series
INSERT INTO public.series (id, title_en, title_am, description_en, description_am, is_active, created_at) VALUES
  (gen_random_uuid(), 'Keys of the Kingdom', 'የመንግስቱ ቁልፎች', 'Understanding the principles of God Kingdom', 'የአምላክ መንግስት መርሆችን መረዳት', true, NOW()),
  (gen_random_uuid(), 'Walking in Faith', 'በእምነት መሄድ', 'Living a life of faith and trust in God', 'በእምነት እና በአምላክ ታማኝነት ህይወት መኖር', true, NOW()),
  (gen_random_uuid(), 'Building Strong Families', 'ጠንካራ ቤተሰቦችን መገንባት', 'Biblical principles for family life', 'ለቤተሰብ ህይወት የአይነ መጻፍት መርሆች', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert Mock Topics
INSERT INTO public.topics (id, name_en, name_am, created_at) VALUES
  (gen_random_uuid(), 'Faith', 'እምነት', NOW()),
  (gen_random_uuid(), 'Prayer', 'ጸሎት', NOW()),
  (gen_random_uuid(), 'Bible Study', 'መጽሐፍ ትምህርት', NOW()),
  (gen_random_uuid(), 'Kingdom Living', 'መንግስታዊ ህይወት', NOW()),
  (gen_random_uuid(), 'Discipleship', 'ተከታዮኝነት', NOW())
ON CONFLICT DO NOTHING;

-- Get IDs for relationships
DO $$
DECLARE
  speaker_id_1 UUID;
  speaker_id_2 UUID;
  speaker_id_3 UUID;
  series_id_1 UUID;
  series_id_2 UUID;
  topic_id_1 UUID;
  topic_id_2 UUID;
  topic_id_3 UUID;
  topic_id_4 UUID;
  topic_id_5 UUID;
  sermon_id_1 UUID;
  sermon_id_2 UUID;
  sermon_id_3 UUID;
  learning_path_id UUID;
  module_id_1 UUID;
  module_id_2 UUID;
  module_id_3 UUID;
BEGIN
  -- Get speaker IDs
  SELECT id INTO speaker_id_1 FROM speakers ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO speaker_id_2 FROM speakers ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO speaker_id_3 FROM speakers ORDER BY created_at LIMIT 1 OFFSET 2;
  
  -- Get series IDs
  SELECT id INTO series_id_1 FROM series ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO series_id_2 FROM series ORDER BY created_at LIMIT 1 OFFSET 1;
  
  -- Get topic IDs
  SELECT id INTO topic_id_1 FROM topics ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO topic_id_2 FROM topics ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO topic_id_3 FROM topics ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO topic_id_4 FROM topics ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO topic_id_5 FROM topics ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Insert Mock Sermon 1
  sermon_id_1 := gen_random_uuid();
  INSERT INTO public.sermons (
    id, title_en, title_am, summary_en, summary_am, video_url, video_thumbnail,
    speaker_id, series_id, is_published, published_at, created_at, view_count
  ) VALUES (
    sermon_id_1,
    'Understanding the Kingdom of God',
    'የአምላክ መንግስትን መረዳት',
    '<p>In this powerful sermon, we explore what it means to be citizens of God Kingdom. Learn how to walk in kingdom authority and live according to divine principles.</p><p>Key points: Kingdom mindset, divine authority, spiritual inheritance.</p>',
    '<p>በዚህ ኃይለኛ መግለጫ ውስጥ የአምላክ መንግስት ዜና መሆን ምን ማለት እንመለከታለን። እንዴት በመንግስታዊ ስልጣን መሄድ እና በመልካሽ መርሆች መኖር ይማሩ።</p>',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800',
    speaker_id_1,
    series_id_1,
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days',
    156
  );
  
  -- Insert Mock Sermon 2
  sermon_id_2 := gen_random_uuid();
  INSERT INTO public.sermons (
    id, title_en, title_am, summary_en, summary_am, video_url, video_thumbnail,
    speaker_id, series_id, is_published, published_at, created_at, view_count
  ) VALUES (
    sermon_id_2,
    'Walking by Faith, Not by Sight',
    'በእምነት መሄድ እንጂ በእይታ አይደለም',
    '<p>Discover how to trust God completely and walk in faith even when circumstances seem impossible. This teaching will strengthen your spiritual walk.</p><p>Key points: Trusting God, overcoming fear, stepping out in faith.</p>',
    '<p>በእምነት ሙሉ በሙሉ አምላክን እንዴት መታመን እና በእምነት መሄድ ይማሩ። ይህ ትምህርት የእስልምና ጉዟዎን ይጠነክራል።</p>',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    speaker_id_2,
    series_id_2,
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    89
  );
  
  -- Insert Mock Sermon 3
  sermon_id_3 := gen_random_uuid();
  INSERT INTO public.sermons (
    id, title_en, title_am, summary_en, summary_am, video_url, video_thumbnail,
    speaker_id, series_id, is_published, published_at, created_at, view_count
  ) VALUES (
    sermon_id_3,
    'Building a Godly Family',
    'የአምላክን ቤተሰብ መገንባት',
    '<p>Learn biblical principles for building a strong, God-honoring family. From marriage to parenting, discover God design for family life.</p><p>Key points: Biblical marriage, parenting wisdom, family altar.</p>',
    '<p>ጠንካራ እና ለአምላክ የሚያከብር ቤተሰብ መገንባት የአይነ መጻፍት መርሆችን ይማሩ። ከጋቢነት እስከ የልጅ አሳድግነት የአምላክ ዲዛይን ለቤተሰብ ህይወት ይፈልጉ።</p>',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    speaker_id_3,
    series_id_1,
    true,
    NOW(),
    NOW() - INTERVAL '1 day',
    234
  );
  
  -- Link topics to sermons
  INSERT INTO public.sermon_topics (sermon_id, topic_id) VALUES
    (sermon_id_1, topic_id_1),
    (sermon_id_1, topic_id_4),
    (sermon_id_2, topic_id_1),
    (sermon_id_2, topic_id_2),
    (sermon_id_3, topic_id_3),
    (sermon_id_3, topic_id_5)
  ON CONFLICT DO NOTHING;
  
  -- Insert mock comments
  INSERT INTO public.comments (id, sermon_id, user_id, content, created_at) VALUES
    (gen_random_uuid(), sermon_id_1, (SELECT id FROM profiles LIMIT 1), 'This sermon really blessed me! Thank you.', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), sermon_id_2, (SELECT id FROM profiles LIMIT 1), 'Powerful teaching on faith!', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), sermon_id_3, (SELECT id FROM profiles LIMIT 1), 'Great message for families.', NOW())
  ON CONFLICT DO NOTHING;
  
  -- Insert mock learning path
  learning_path_id := gen_random_uuid();
  INSERT INTO public.learning_paths (id, title_en, title_am, description_en, description_am, cover_image, difficulty_level, estimated_duration_minutes, sort_order, is_published, created_at) VALUES
    (learning_path_id, 'Keys of the Kingdom', 'የመንግስቱ ቁልፎች', 'Discover the foundational principles of living in God Kingdom through this transformative learning journey.', 'በዚህ መማር ጉዟዎ ውስጥ በአምላክ መንግስት መኖር የመሰረታዊ መርሆችን ያግኙ።', 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800', 'beginner', 180, 1, true, NOW())
  ON CONFLICT DO NOTHING;
  
  -- Insert mock modules
  module_id_1 := gen_random_uuid();
  INSERT INTO public.learning_modules (id, learning_path_id, title_en, title_am, content_en, content_am, sort_order, created_at) VALUES
    (module_id_1, learning_path_id, 'Understanding Kingdom Authority', 'የመንግስታዊ ስልጣን መረዳት', 
     '<p>In this module, we explore what it means to walk in kingdom authority. Jesus gave us authority over all the power of the enemy, and we must learn to exercise it.</p><h3>Key Points</h3><ul><li>Kingdom authority comes from Jesus</li><li>We have power over sickness and demons</li><li>Authority is exercised through faith</li></ul>', 
     '<p>በዚህ ክፍል ውስጥ በመንግስታዊ ስልጣን መሄድ ምን ማለት እንመለከታለን። ኢየሱስ ለእኛ ስልጣን ሰጠናል እኛም ይህንን በእምነት መጠቀም አለብን።</p><h3>ዋና ነጥቦች</h3><ul><li>የመንግስታዊ ስልጣን ከኢየሱስ ይመጣል</li><li>ህመምን እና አማልከንን ማሸነፍ እንችላለን</li><li>ስልጣን በእምነት ይጠቀማል</li></ul>',
     1, NOW())
  ON CONFLICT DO NOTHING;
  
  module_id_2 := gen_random_uuid();
  INSERT INTO public.learning_modules (id, learning_path_id, title_en, title_am, content_en, content_am, sort_order, created_at) VALUES
    (module_id_2, learning_path_id, 'Walking in Kingdom Culture', 'በመንግስታዊ ባህሪያት መሄድ',
     '<p>Kingdom culture is different from the world culture. In this module, we learn the values and principles that govern life in God Kingdom.</p><h3>Key Points</h3><ul><li>Kingdom values vs world values</li><li>Serving others as Jesus did</li><li>Living with humility and love</li></ul>',
     '<p>የመንግስት ባህሪያት ከዓለም ባህሪያት የተለየ ነው። በዚህ ክፍል ውስጥ በአምላክ መንግስት የህይወት ዋጋዎችን እና መርሆችን እንማር።</p><h3>ዋና ነጥቦች</h3><ul><li>የመንግስት ዋጋዎች እና የዓለም ዋጋዎች</li><li>እንደ ኢየሱስ ለሰዎች መገገጽ</li><li>በትህትነት እና በፍቅር መኖር</li></ul>',
     2, NOW())
  ON CONFLICT DO NOTHING;
  
  module_id_3 := gen_random_uuid();
  INSERT INTO public.learning_modules (id, learning_path_id, title_en, title_am, content_en, content_am, sort_order, created_at) VALUES
    (module_id_3, learning_path_id, 'Advancing the Kingdom', 'መንግስቱን ማሳደግ',
     '<p>The final module focuses on how we can advance God Kingdom on earth through our daily lives, work, and relationships.</p><h3>Key Points</h3><ul><li>Being salt and light</li><li>Making disciples</li><li>Praying for Kingdom advancement</li></ul>',
     '<p>የመጨረሻው ክፍል በየጊዜ ህይወት፣ በስራችን እና በግንኙነታችን አምላክን መንግስት እንዴት እንዋስን ላይ ያተኩራል።</p><h3>ዋና ነጥቦች</h3><ul><li>በመብርህ እና በብርሃን መሆን</li><li>ተከታዮችን ማዳቀል</li><li>ለመንግስቱ ማሳደግ መጸልየር</li></ul>',
     3, NOW())
  ON CONFLICT DO NOTHING;
  
  -- Insert quizzes for each module
  INSERT INTO public.quizzes (id, module_id, question_en, question_am, options_en, options_am, correct_index, explanation_en, explanation_am, created_at) VALUES
    (gen_random_uuid(), module_id_1, 
     'Where does kingdom authority come from?', 
     'የመንግስታዊ ስልጣን ከየት ይመጣል?',
     '["From our own merit", "From Jesus Christ", "From church leadership", "From wealth"]',
     '["ከራሳችን ጥበብ", "ከኢየሱስ ክርስቶስ", "ከቤተክርስቲያን አስተዳዳሪ", "ከገንዘብ"]',
     1,
     'Jesus gave us authority when He said "I give you authority...over all the power of the enemy." Our authority comes from Him, not ourselves.',
     'ኢየሱስ ስልጣን ሰጠናል በሚል ጊዜ "ስልጣን እሰጥላችሁ...ላለችሁ ሁሉ ኃይል"። ስልጣናችን ከእርሱ ይመጣል እንጂ ከራሳችን አይደለም።',
     NOW()),
    (gen_random_uuid(), module_id_2,
     'What should we seek first according to Jesus?',
     'እንደ ኢየሱስ መጀመር ምን እንፈልጋለን?',
     '["Wealth", "Kingdom of God and His righteousness", "Fame", "Power"]',
     '["ገንዘብ", "የአምላክን መንግስት እና ጽድቱን", "አዝናኝ", "ስልጣን"]',
     1,
     'Jesus taught us to seek first the Kingdom of God and His righteousness, and all these things shall be added to us.',
     'ኢየሱስ መጀመር የአምላክን መንግስት እና ጽድቱን እንድፈልግ አስተምረናል፣ እነሆ ይህም ሁሉ ይቀርብላችኋል።',
     NOW()),
    (gen_random_uuid(), module_id_3,
     'What is the Great Commission?',
     'የታላቁ ትእዛዝ ምንድን ነው?',
     '["Build big churches", "Make disciples of all nations", "Become rich", "Get famous"]',
     '["ትላልቅ ቤተክርስቲያኖችን መገንባት", "ለአለሙ ሁሉ ተከታዮችን ማዳቀል", "ገንዘቛም መሆን", "አዝናኝ መሆን"]',
     1,
     'Jesus commanded us to go and make disciples of all nations, teaching them to obey everything He commanded.',
     'ኢየሱስ ለአለሙ ሁሉ ተከታዮችን እንድንዳቀል እና የአዘዘንን ሁሉ እንድንስምር ተደንቀናል።',
     NOW());
    
END $$;
