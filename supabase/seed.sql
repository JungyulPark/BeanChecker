-- 자동 생성: node scripts/generate-seed-sql.mjs (원본: launch/*.csv)
-- 실행 컨텍스트: 직접 연결(postgres) — RLS 미적용. idempotent.

insert into public.cafes (name, is_roastery, location, address, district, slug, verified)
values
  ('센터커피 서울숲점', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 서울숲2길 28-11', 'seongsu', 'center-coffee', false),
  ('로우키', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 연무장3길 6', 'seongsu', 'lowkey', false),
  ('커피냅로스터스 성수', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 성수일로4길 35-11', 'seongsu', 'coffee-nap-roasters', false),
  ('메쉬커피', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 서울숲길 43', 'seongsu', 'mesh-coffee', false),
  ('성수동 리얼 로스팅 커피&디저트', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 성수동2가 277-129', 'seongsu', 'real-roasting', false),
  ('피어커피 로스터스', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 광나루로4가길 24 1층', 'seongsu', 'peer-coffee-roasters', false),
  ('마일스톤 커피 로스터스 서울숲', true, 'POINT(127.056 37.544)'::extensions.geography, '서울특별시 성동구 서울숲4길 15 1층', 'seongsu', 'milestone-coffee-roasters', false),
  ('히트커피로스터스 한남', true, 'POINT(127.001 37.534)'::extensions.geography, '서울특별시 용산구 이태원로 258', 'hannam', 'hit-coffee-roasters', false),
  ('트래버틴 한남', true, 'POINT(127.001 37.534)'::extensions.geography, '서울특별시 용산구 독서당로14길 24, 브라이튼한남 1층', 'hannam', 'travertine', false),
  ('피어커피 바 한남', true, 'POINT(127.001 37.534)'::extensions.geography, '서울특별시 용산구 한남대로10길 36 1층', 'hannam', 'peer-coffee-bar', false),
  ('콘하스', true, 'POINT(127.001 37.534)'::extensions.geography, '서울특별시 용산구 이태원로55나길 22', 'hannam', 'conhas', false),
  ('마일스톤 커피 로스터스 한남', true, 'POINT(127.001 37.534)'::extensions.geography, '서울특별시 용산구 한남대로27가길 26 1층', 'hannam', 'milestone-coffee-roasters', false),
  ('커피리브레 연남', true, 'POINT(126.925 37.562)'::extensions.geography, '서울 마포구 성미산로32길 20-5', 'yeonnam', 'coffee-libre', false),
  ('커피냅로스터스 연남', true, 'POINT(126.925 37.562)'::extensions.geography, '서울 마포구 성미산로27길 70', 'yeonnam', 'coffee-nap-roasters', false),
  ('리이슈 커피로스터스', true, 'POINT(126.925 37.562)'::extensions.geography, '서울 마포구 연남로 35, 2층', 'yeonnam', 'reissue-coffee-roasters', false),
  ('모닝캄 커피랩 연남', true, 'POINT(126.925 37.562)'::extensions.geography, '서울 마포구 성미산로 192', 'yeonnam', 'morning-calm-coffee-lab', false),
  ('궤도 커피 로스터스 연남', true, 'POINT(126.925 37.562)'::extensions.geography, '서울 마포구 연남로 19 1층', 'yeonnam', 'gwehdo-coffee-roasters', false),
  ('테일러커피 연남1호점', true, 'POINT(126.925 37.562)'::extensions.geography, '서울 마포구 성미산로 189 1층', 'yeonnam', 'tailor-coffee', false),
  ('앤트러사이트 커피 합정', true, 'POINT(126.913 37.549)'::extensions.geography, '서울 마포구 토정로5길 10', 'hapjeong', 'anthracite-coffee-roasters', false),
  ('빈브라더스 합정', true, 'POINT(126.913 37.549)'::extensions.geography, '서울 마포구 합정동 368-3', 'hapjeong', 'bean-brothers', false),
  ('커피랩스 로스터리 합정', true, 'POINT(126.913 37.549)'::extensions.geography, '서울 마포구 양화로6길 27, 1·2층', 'hapjeong', 'coffee-labs-roastery', false),
  ('180커피로스터스 합정', true, 'POINT(126.913 37.549)'::extensions.geography, '서울 마포구 토정로 8-7, 3층', 'hapjeong', '180-coffee-roasters', false),
  ('레드플랜트 본점', true, 'POINT(126.913 37.549)'::extensions.geography, '서울 마포구 양화로7길 6', 'hapjeong', 'red-plant', false),
  ('빌리프커피로스터스', true, 'POINT(126.913 37.549)'::extensions.geography, '서울 마포구 양화로11길 50', 'hapjeong', 'belief-coffee-roasters', false),
  ('딥블루레이크', true, 'POINT(126.902 37.556)'::extensions.geography, '서울특별시 마포구 포은로6길 11', 'mangwon', 'deep-blue-lake-coffee-roasters', false),
  ('포트레이트 커피(바)', true, 'POINT(126.902 37.556)'::extensions.geography, '서울특별시 마포구 포은로8길 32', 'mangwon', 'portrait-coffee-bar', false),
  ('올웨이즈어거스트 로스터스', true, 'POINT(126.902 37.556)'::extensions.geography, '서울 마포구 망원로6길 19', 'mangwon', 'always-august-roasters', false),
  ('센토브(트래피 커피)', true, 'POINT(126.902 37.556)'::extensions.geography, '서울 마포구 희우정로 98', 'mangwon', 'sentov-trafe-coffee', false),
  ('오랑오랑', true, 'POINT(126.988 37.545)'::extensions.geography, '서울 용산구 소월로20길 26-14', 'haebangchon', 'orangorang', false),
  ('프릳츠 커피 컴퍼니 도화점', true, 'POINT(126.949 37.54)'::extensions.geography, '서울시 마포구 새창로2길 17', 'dohwa', 'fritz-coffee-company', false),
  ('Coffee ARCO', true, 'POINT(127.02 37.516)'::extensions.geography, '서울 강남구 신사동 519-17', 'sinsa', 'coffee-arco', false),
  ('마일스톤 커피 로스터스 신사', true, 'POINT(127.02 37.516)'::extensions.geography, '서울 강남구 논현로159길 49 1층', 'sinsa', 'milestone-coffee-roasters', false),
  ('테일러커피 신사', true, 'POINT(127.02 37.516)'::extensions.geography, '서울 강남구 강남대로160길 31', 'sinsa', 'tailor-coffee', false),
  ('히트커피 로스터스 신사', true, 'POINT(127.02 37.516)'::extensions.geography, '서울 강남구 도산대로17길 34', 'sinsa', 'heat-coffee-roasters', false),
  ('커피휘엘 신사역점', true, 'POINT(127.02 37.516)'::extensions.geography, '서울 강남구 논현로149길 62', 'sinsa', 'coffee-fiel', false),
  ('마크레인 커피로스터스', true, 'POINT(127.028 37.527)'::extensions.geography, '서울 강남구 선릉로157길 23-5', 'apgujeong', 'mark-lane-coffee-roasters', false),
  ('벙커컴퍼니 압구정', true, 'POINT(127.028 37.527)'::extensions.geography, '서울 강남구 압구정로42길 10', 'apgujeong', 'bunker-company', false),
  ('카멜커피 도산2호점', true, 'POINT(127.028 37.527)'::extensions.geography, '서울 강남구 언주로164길 14-1', 'apgujeong', 'camel-coffee', false),
  ('리플렉트커피 로스팅 랩', true, 'POINT(127.034 37.484)'::extensions.geography, '서울 서초구 남부순환로347길 53 104호', 'yangjae', 'reflect-coffee-roasting-lab', false),
  ('프릳츠커피컴퍼니 양재점', true, 'POINT(127.034 37.484)'::extensions.geography, '서울 서초구 강남대로37길 24-11', 'yangjae', 'fritz-coffee-company', false),
  ('테라로사 양재역점', true, 'POINT(127.034 37.484)'::extensions.geography, '서울 서초구 강남대로 206 엔스빌딩 1층', 'yangjae', 'terarosa', false),
  ('커피플랜트 양재', true, 'POINT(127.034 37.484)'::extensions.geography, '서울 서초구 양재동', 'yangjae', 'coffee-plant', false),
  ('커피한약방', true, 'POINT(126.991 37.566)'::extensions.geography, '서울 중구 삼일대로12길 16-6', 'euljiro', 'coffee-hanyakbang', false),
  ('리사르커피 을지로점', true, 'POINT(126.991 37.566)'::extensions.geography, '서울 중구 창경궁로28-24, 1층', 'euljiro', 'leesar-coffee', false),
  ('챔프커피 을지로점', true, 'POINT(126.991 37.566)'::extensions.geography, '서울 중구 을지로 157 라열 3층 381호', 'euljiro', 'champ-coffee', false),
  ('연흔 로스터스', true, 'POINT(126.97 37.579)'::extensions.geography, '서울 종로구 자하문로7길 29', 'seochon', 'yeonhun-roasters', false),
  ('아키비스트', true, 'POINT(126.97 37.579)'::extensions.geography, '서울 종로구 효자로13길 52', 'seochon', 'archivist', false),
  ('통인동커피공방 위켄드', true, 'POINT(126.97 37.579)'::extensions.geography, '서울 종로구 자하문로9길 16, 1층', 'seochon', 'tongin-dong-coffee-workshop-weekend', false),
  ('커피투어 광화문점', true, 'POINT(126.97 37.579)'::extensions.geography, '서울 종로구 사직로10길 12, 신우빌딩 1층', 'seochon', 'coffee-tour-roasters', false)
on conflict (district, slug) do nothing;

insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '올드독', '올드독olddog', c.id, 'blend', '코스타리카40%/인도35%/과테말라25%', 'washed', null, array['다크초콜릿','흑당','로스티드 피칸'], 'old-dog', false
from public.cafes c where c.name = '프릳츠 커피 컴퍼니 도화점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '서울 시네마', '서울시네마', c.id, 'blend', null, null, null, array['밝은 산미와 깨끗한 단맛'], 'seoul-cinema', false
from public.cafes c where c.name = '프릳츠 커피 컴퍼니 도화점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '나쓰메 소세키', '나쓰메소세키', c.id, 'blend', '에티오피아 아리차·콜롬비아 후일라·과테말라 와이칸', null, null, array['시트러스','아몬드','밀크초콜릿'], 'natsume-soseki', false
from public.cafes c where c.name = '앤트러사이트 커피 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '공기와 꿈', '공기와꿈', c.id, 'blend', '에티오피아 코케·케냐 키리냐가·과테말라 와이칸', null, null, array['복합 플로럴','레드커런트','자몽','캐슈넛'], 'air-and-dream', false
from public.cafes c where c.name = '앤트러사이트 커피 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '파블로 네루다', '파블로네루다', c.id, 'blend', '과테말라 와이칸·에티오피아 아리차', null, null, array['크랜베리','스트로베리','헤이즐넛','브라운슈가'], 'pablo-neruda', false
from public.cafes c where c.name = '앤트러사이트 커피 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '배드 블러드', '배드블러드', c.id, 'blend', '에티오피아30%/코스타리카40%/니카라과30%', null, null, array['과일 시럽의 단맛'], 'bad-blood', false
from public.cafes c where c.name = '커피리브레 연남'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '노 서프라이즈', '노서프라이즈', c.id, 'blend', '인도40%/온두라스40%/에티오피아20%', null, null, array['농밀한 과일의 단맛'], 'no-surprise', false
from public.cafes c where c.name = '커피리브레 연남'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '다크 리브레', '다크리브레', c.id, 'blend', '인도50%/온두라스20%/콜롬비아30%', null, null, array['다크초콜릿','견과의 고소함'], 'dark-libre', false
from public.cafes c where c.name = '커피리브레 연남'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '블랙수트', '블랙수트', c.id, 'blend', '브라질60%/콜롬비아25%/에티오피아15%', null, null, array['풍부한 초콜릿향'], 'black-suit', false
from public.cafes c where c.name = '빈브라더스 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '벨벳화이트', '벨벳화이트', c.id, 'ethiopia', null, null, null, array['싱그러운 시트러스향'], 'velvet-white', false
from public.cafes c where c.name = '빈브라더스 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '콜롬비아 알토스 델 파라이소', '콜롬비아알토스델파라이소', c.id, 'colombia', null, null, null, array['과일잼','야생꿀','레드커런트'], 'altos-del-paraiso', false
from public.cafes c where c.name = '빈브라더스 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '바이올렛 블렌드', '바이올렛블렌드', c.id, 'blend', '에티오피아 내추럴+콜롬비아 워시드', null, null, array['과일의 단맛과 산미'], 'violet-blend', false
from public.cafes c where c.name = '180커피로스터스 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '콜롬비아 엘 레나세르 옴블리곤', '콜롬비아엘레나세르옴블리곤', c.id, 'colombia', null, null, null, array['다크체리','오렌지필','벨벳 같은 다크초콜릿 피니시'], 'el-renacer-ombligon', false
from public.cafes c where c.name = '180커피로스터스 합정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '콜롬비아 엘 실렌시오', '콜롬비아엘실렌시오', c.id, 'colombia', null, 'washed', null, array['망고 등 열대과일향'], 'el-silencio', false
from public.cafes c where c.name = '리플렉트커피 로스팅 랩'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '콜롬비아 엘 로사리오', '콜롬비아엘로사리오', c.id, 'colombia', null, 'other', null, array['수박향'], 'el-rosario', false
from public.cafes c where c.name = '리플렉트커피 로스팅 랩'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '콜롬비아 엘 엔칸토', '콜롬비아엘엔칸토', c.id, 'colombia', null, null, null, array['딸기 등 베리향'], 'el-encanto', false
from public.cafes c where c.name = '리플렉트커피 로스팅 랩'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '올데이 블렌드', '올데이블렌드', c.id, 'blend', '과테말라·브라질 베이스+르완다·케냐·에티오피아', null, null, array['진한 초콜릿','농후한 단맛','부드러운 목넘김'], 'all-day-blend', false
from public.cafes c where c.name = '테라로사 양재역점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '버터리', '버터리', c.id, 'blend', '에티오피아 시다모/콜롬비아 마이크로랏/인도 카피 로얄', null, 5, array['진하고 고소한 맛'], 'buttery', false
from public.cafes c where c.name = '벙커컴퍼니 압구정'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '고티지', '고티지', c.id, 'blend', '구성 비공개', null, null, array['균형잡힌 풍미'], 'gotige', false
from public.cafes c where c.name = '카멜커피 도산2호점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '뉴텐던시', '뉴텐던시', c.id, 'blend', '구성 비공개', null, null, array['조화로운 과일향'], 'new-tendency', false
from public.cafes c where c.name = '카멜커피 도산2호점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '블랙 인 서울', '블랙인서울', c.id, 'blend', '구성 비공개', null, null, array['너트','카라멜','초콜릿'], 'black-in-seoul', false
from public.cafes c where c.name = '챔프커피 을지로점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '브라운 인 서울', '브라운인서울', c.id, 'blend', '구성 비공개', null, null, array['허니','카라멜','딸기'], 'brown-in-seoul', false
from public.cafes c where c.name = '챔프커피 을지로점'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '과테말라 엘 소코로 게이샤', '과테말라엘소코로게이샤', c.id, 'guatemala', null, null, null, null, 'el-socorro-gesha', false
from public.cafes c where c.name = '로우키'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '콜롬비아 콘사카', '콜롬비아콘사카', c.id, 'colombia', null, null, null, null, 'consaca', false
from public.cafes c where c.name = '로우키'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '에티오피아 아리차', '에티오피아아리차', c.id, 'ethiopia', null, null, null, null, 'aricha', false
from public.cafes c where c.name = '로우키'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select 'Deep 블렌딩', 'deep블렌딩', c.id, 'blend', '구성 비공개', null, 2, array['고소한 향미와 깔끔한 산미'], 'deep-blending', false
from public.cafes c where c.name = '딥블루레이크'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select 'Blue 블렌딩', 'blue블렌딩', c.id, 'blend', '구성 비공개', null, 2, array['복합적인 베리류 향미'], 'blue-blending', false
from public.cafes c where c.name = '딥블루레이크'
on conflict (origin, slug) do nothing;
insert into public.beans (name, normalized_name, roaster_id, origin, region, process, roast_level, official_notes, slug, verified)
select '케냐 싱글오리진', '케냐싱글오리진', c.id, 'kenya', null, null, null, array['레몬 껍질을 씹은 듯한 산미'], 'travertine-kenya', false
from public.cafes c where c.name = '트래버틴 한남'
on conflict (origin, slug) do nothing;
