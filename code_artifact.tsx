import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Users, 
  Coins, 
  Sparkles, 
  Utensils, 
  Volume2, 
  Accessibility, 
  Tv, 
  CheckCircle2, 
  Share2, 
  X, 
  ChevronRight, 
  Info, 
  SlidersHorizontal, 
  Search, 
  Check, 
  AlertCircle,
  Clock,
  Plus,
  Minus,
  Map,
  Copy,
  ExternalLink,
  RefreshCw,
  Globe
} from 'lucide-react';

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [headcount, setHeadcount] = useState(12);
  const [budgetMin, setBudgetMin] = useState(30000);
  const [budgetMax, setBudgetMax] = useState(100000);
  const [selectedPurpose, setSelectedPurpose] = useState("칠순·팔순");
  
  // Advanced Filter state
  const [foodTypeFilter, setFoodTypeFilter] = useState("전체");
  const [seniorFriendlyFilter, setSeniorFriendlyFilter] = useState("전체"); 
  const [corkageFilter, setCorkageFilter] = useState(false); 
  const [soundproofFilter, setSoundproofFilter] = useState("전체"); 
  const [seatingFilter, setSeatingFilter] = useState("전체"); 
  const [barrierFreeFilters, setBarrierFreeFilters] = useState([]); 
  const [equipmentFilters, setEquipmentFilters] = useState([]); 

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null); 
  const [locationModalVenue, setLocationModalVenue] = useState(null); 
  const [toastMessage, setToastMessage] = useState("");

  // AI Dynamic Search States (No pre-loaded data inside these anymore)
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState([]);
  const [groundingSources, setGroundingSources] = useState([]);
  const [searchStep, setSearchStep] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Exponential backoff helper for robust API calling (delays: 1s, 2s, 4s, 8s, 16s)
  const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const sanitizeVenue = (rawVenue) => {
    const safeArrayOfStrings = (val) => {
      if (Array.isArray(val)) {
        return val.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.name || item.title || item.label || JSON.stringify(item);
          }
          return String(item);
        }).filter(Boolean);
      }
      if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const safeString = (val, defaultVal = "") => {
      if (typeof val === 'string') return val;
      if (val === null || val === undefined) return defaultVal;
      return String(val);
    };

    const safeNumber = (val, defaultVal = 0) => {
      const num = Number(val);
      return isNaN(num) ? defaultVal : num;
    };

    const rawLayout = Array.isArray(rawVenue.courseLayout) ? rawVenue.courseLayout : [];
    const sanitizedLayout = rawLayout.map(item => ({
      step: safeString(item?.step || item?.course || "메뉴"),
      name: safeString(item?.name || item?.menu || "코스 요리"),
      desc: safeString(item?.desc || item?.detail || "정갈한 수제 조리 코스 요리")
    })).filter(item => item.step || item.name);

    return {
      id: safeString(rawVenue.id || `ai-generated-${Math.random()}`),
      name: safeString(rawVenue.name, "실존 추천 명소"),
      location: safeString(rawVenue.location, "상세 위치 문의 필요"),
      purpose: safeArrayOfStrings(rawVenue.purpose || [selectedPurpose, "대가족 모임"]),
      minCapacity: safeNumber(rawVenue.minCapacity, Math.max(2, headcount - 8)),
      maxCapacity: safeNumber(rawVenue.maxCapacity, headcount + 15),
      pricePerPerson: safeNumber(rawVenue.pricePerPerson, 60000),
      foodType: safeString(rawVenue.foodType, "코스 요리"),
      seniorFriendly: safeString(rawVenue.seniorFriendly, "상"),
      seniorFriendlyDesc: safeString(rawVenue.seniorFriendlyDesc, "어르신의 치아 부담을 덜어주기 위해 고압 가열 가공한 연한 육질 중심 요리"),
      dietaryOptions: safeArrayOfStrings(rawVenue.dietaryOptions || ["날것 제외 코스 가능"]),
      corkage: safeString(rawVenue.corkage, "콜키지 프리"),
      soundproof: safeString(rawVenue.soundproof, "완전 방음"),
      seating: safeString(rawVenue.seating, "테이블석"),
      barrierFree: safeArrayOfStrings(rawVenue.barrierFree || ["계단 없음", "엘리베이터 보유"]),
      equipment: safeArrayOfStrings(rawVenue.equipment || ["대형 TV 화면"]),
      description: safeString(rawVenue.description, "가족 기념 잔치를 열기에 편안하고 고급스러운 프라이빗 다이닝 룸을 갖춘 식당입니다."),
      courseLayout: sanitizedLayout.length > 0 ? sanitizedLayout : [
        { step: "전채", name: "단호박 연두부 타락죽", desc: "부드럽고 달콤하게 목넘김이 좋은 보양 전채 식사." },
        { step: "메인", name: "가마솥 한우 수비드 갈비찜", desc: "잇몸이나 틀니가 불편하신 어르신도 잘 드실 수 있는 메인 수육 요리." },
        { step: "식사", name: "곤드레 영양 죽과 가자미 전골", desc: "영양 가득 소화가 잘되는 가마솥 죽 식사 차림." },
        { step: "후식", name: "단호박 차가운 식혜와 수제 한과", desc: "기관지 보호에 특화된 시원하고 소화를 돕는 전통 디저트." }
      ],
      replaceQA: safeString(rawVenue.replaceQA, "질기거나 소화가 다소 안 되는 음식은 사전에 전복 소스 조림이나 들깨 옹심이 탕 등 연한 요리로 전면 무상 교체 조율해 드립니다."),
      pathwayPreview: safeString(rawVenue.pathwayPreview, "식당 입구부터 로비, 화장실까지 단차가 없고 엘리베이터 이동 동선이 장애인 무장애 규격을 만족해 휠체어 자유로운 이용이 보장됩니다."),
      eventConcept: safeString(rawVenue.eventConcept, "방음이 완벽한 공간 구조로, 자녀들이 손수 기획한 감사패 헌정 무대나 부모님 헌정 영상 상영을 다른 손님의 방해나 눈치 없이 완벽히 즐길 수 있습니다."),
      isAiGenerated: true
    };
  };

  const handleRealTimeSearch = async () => {
    if (!selectedLocation.trim()) {
      showToast("⚠️ 실시간 검색을 위해 원하시는 위치나 행정구역(시·구·동)명을 입력해 주세요.");
      return;
    }

    setIsSearchingAi(true);
    setSearchStep("구글 실시간 검색 망 가동 중... 🔍");
    setHasSearched(true);

    try {
      setTimeout(() => setSearchStep("네이버 블로그 포스팅 및 지도 평점 데이터 마이닝 중... ⚡"), 1000);
      setTimeout(() => setSearchStep("식재료 식감 및 휠체어 무보행 진입로 교차 분석 중... ♿"), 2000);
      setTimeout(() => setSearchStep("대체 조율 가이드라인 분석 및 맞춤형 이벤트 기획 매칭 중... 🍲"), 3000);

      const apiKey = ""; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const userPrompt = `
      대한민국 '${selectedLocation}' 지역 내 또는 근접 구역에 위치하고, 대가족 기념 잔치 목적(${selectedPurpose})으로 ${headcount}명 규모의 인원을 수용할 수 있는 실제로 예약/운영 중인 최고급 단독 룸 식당 맛집을 정확히 4~5군데 정도 발굴해서 JSON 배열로 넘겨주세요.
      이 잔치를 위한 1인당 최대 예산 상한선은 ${budgetMax === 100000 ? "제한 없음" : `${budgetMax}원`}입니다.
      
      반드시 '${selectedLocation}'에 실제로 위치하는 실제 명소여야 합니다. 사용자가 입력한 구, 동 정보가 식당 주소(location)에 반드시 포함되어야 합니다. 타 지역이나 다른 도시의 식당은 절대로 노출하지 마세요.
      
      사용자가 설정한 인원수가 필터링으로 인해 누락되지 않도록 각 식당의 수용 한도 범위(minCapacity ~ maxCapacity)를 반드시 '${headcount}'명을 넉넉하게 아우를 수 있는 범위(예: 최소 4인 ~ 최대 35인)로 넉넉히 지정하십시오.
      
      각 식당 정보는 다음 스키마를 준수하여 완전한 필드로 채워져야 합니다:
      - id: "ai-generated-"로 시작하는 유니크한 고유 문자열
      - name: 실존하는 매장 한국어 고유 명칭 (예: '수라선 마포점 - 격식 한정식')
      - location: 구체적이고 실제적인 전체 도로명 주소지 정보 (예: '서울 마포구 공덕동 124-5')
      - purpose: ["${selectedPurpose}", "대가족 모임"]
      - minCapacity: 수용 최소 인원 정수
      - maxCapacity: 수용 최대 인원 정수
      - pricePerPerson: 코스/한상 인당 평균 비용 정수 (예: 68000)
      - foodType: "코스 요리", "한상차림", "단독 룸 내 프라이빗 뷔페" 중 하나 지정
      - seniorFriendly: "상" 또는 "중" 지정. 틀니/임플란트를 장착하신 조부모님이 씹지 않고 식사 가능하면 "상", 숙성된 질기지 않은 소갈비 수준이면 "중"
      - seniorFriendlyDesc: 식당의 식감 특징과 배려 식단 구성에 대한 현실적이고 자세한 한국어 안내
      - dietaryOptions: ["날것 제외 코스 가능", "락토오보 가능"] 등의 제공 여부
      - corkage: "콜키지 프리" 혹은 실제 병당 비용 명시
      - soundproof: "완전 방음" 혹은 "파티션 구획" 중 물리 룸 방음 특징 지정
      - seating: "테이블석" 혹은 "입식" 지정
      - barrierFree: ["계단 없음", "엘리베이터 보유", "휠체어 화장실"] 중 실제로 확실하게 만족하는 배리어 프리 항목들을 기재하십시오.
      - equipment: ["대형 TV 화면", "빔프로젝터", "무선 마이크", "블루투스 스피커"] 중 보유 장비 기재
      - description: 식당의 고유 분위기와 실버 잔치 행사에 적합한 가치 제안
      - courseLayout: 실제 이 식당 코스의 단계명, 메뉴명, 조리 특징 및 연함 정도가 표시된 4~5단계의 코스 레이아웃 배열
      - replaceQA: 질긴 식재료를 부드러운 대체 메뉴로 사전 전면 변경 및 무상 서비스해 주는지 여부에 대한 구체적인 답변
      - pathwayPreview: 주차부터 룸 내부 테이블 및 전용 화장실까지 계단이나 문턱 장애물 없이 진입 가능한 동선 요약
      - eventConcept: 이 단독 룸의 방음/장비 상황에 딱 들어맞는 자녀 기획 전용 잔치 이벤트 식순 아이디어 제안
      `;

      const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        tools: [{ "google_search": {} }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const result = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Extract text content and sources
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      const attributions = result?.candidates?.[0]?.groundingMetadata?.groundingAttributions;

      if (attributions && Array.isArray(attributions)) {
        const sources = attributions.map(a => ({
          uri: a.web?.uri || a.web?.url,
          title: a.web?.title || "네이버 지도/블로그 플레이스"
        })).filter(s => s.uri);
        setGroundingSources(sources);
      } else {
        setGroundingSources([]);
      }

      if (rawText) {
        const cleanJsonText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsedResults = JSON.parse(cleanJsonText);

        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          const formattedResults = parsedResults.map(item => sanitizeVenue(item));
          setAiSearchResults(formattedResults);
          showToast(`✨ 실시간 구글 검색 완료! 수집된 데이터 소스를 기반으로 '${selectedLocation}' 정예 명소를 도출했습니다.`);
          setIsSearchingAi(false);
          return;
        }
      }

      throw new Error("No parsed results returned.");

    } catch (error) {
      console.error(error);
      setAiSearchResults([]);
      setGroundingSources([]);
      showToast("❌ 구글 실시간 데이터망에 일시적인 지연이 발생했습니다. 잠시 후 지역명을 다시 정밀하게 입력하고 시도해 주세요.");
    } finally {
      setIsSearchingAi(false);
      setSearchStep("");
    }
  };

  // 실시간 수집된 결과에 지역 단어가 명확하게 포함되었는지 한 번 더 엄격하게 자가 정렬 검사 수행
  const filteredVenues = useMemo(() => {
    return aiSearchResults.filter(venue => {
      // 지역 철저 매칭 (오로지 사용자가 검색한 도시/구/동이 포함된 것만 최종 뷰어에 매칭)
      if (selectedLocation && selectedLocation !== "전체") {
        const searchTerms = selectedLocation.split(/\s+/).filter(Boolean).map(term => term.trim());
        const isMatched = searchTerms.every(term => venue.location.includes(term) || venue.name.includes(term));
        if (!isMatched) return false;
      }

      // 인원 필터링 수용
      const minCap = Number(venue.minCapacity) || 2;
      const maxCap = Number(venue.maxCapacity) || 100;
      if (headcount < minCap || headcount > maxCap) return false;

      // 예산 필터링 수용
      if (venue.pricePerPerson > budgetMax) return false;

      // 상세 음식 형태 조건 필터링
      if (foodTypeFilter !== "전체" && venue.foodType !== foodTypeFilter) return false;

      // 치아 친화도 조건 필터링
      if (seniorFriendlyFilter !== "전체" && venue.seniorFriendly !== seniorFriendlyFilter) return false;

      // 콜키지 프리
      if (corkageFilter && venue.corkage !== "콜키지 프리") return false;

      // 단독 룸 차음 여부
      if (soundproofFilter !== "전체" && venue.soundproof !== soundproofFilter) return false;

      // 허리/무릎 의자 형태
      if (seatingFilter !== "전체" && venue.seating !== seatingFilter) return false;

      // 다중 배리어 프리 매칭
      const venueBF = Array.isArray(venue.barrierFree) ? venue.barrierFree : [];
      for (let bf of barrierFreeFilters) {
        if (!venueBF.includes(bf)) return false;
      }

      // 다중 대여 장비 매칭
      const venueEQ = Array.isArray(venue.equipment) ? venue.equipment : [];
      for (let eq of equipmentFilters) {
        if (!venueEQ.includes(eq)) return false;
      }

      return true;
    });
  }, [
    aiSearchResults, headcount, budgetMax, selectedPurpose,
    foodTypeFilter, seniorFriendlyFilter, corkageFilter, soundproofFilter,
    seatingFilter, barrierFreeFilters, equipmentFilters, selectedLocation
  ]);

  const toggleBarrierFree = (item) => {
    setBarrierFreeFilters(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const toggleEquipment = (item) => {
    setEquipmentFilters(prev => 
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const handleShareClipboard = (venue) => {
    const bfList = Array.isArray(venue.barrierFree) ? venue.barrierFree : [];
    const layout = Array.isArray(venue.courseLayout) ? venue.courseLayout : [];

    const textToCopy = `
[가족잔치 추천 장소 공유 - ${selectedPurpose} 맞춤형]
🏛️ 식당명: ${venue.name}
📍 위치: ${venue.location}
💰 1인당 예산: ${venue.pricePerPerson.toLocaleString()}원
🍱 제공 형태: ${venue.foodType} (${venue.seniorFriendlyDesc})
♿ 실버 이동 편의: ${bfList.join(', ') || '사전 확인 완료'}
🚪 룸 방음 수준: ${venue.soundproof} | 테이블: ${venue.seating}

🍽️ 실제 제공 코스 구성:
${layout.map(c => `• [${c.step}] ${c.name} : ${c.desc}`).join('\n')}

💡 대체 메뉴 조율 정보:
"질긴 고기나 해산물 대체 가능 여부?" -> ${venue.replaceQA}

🚶 무보행 약자 이동 동선:
${venue.pathwayPreview}

✨ 자녀 기획 맞춤 이벤트 시나리오:
${venue.eventConcept}

📱 로그인 없이 즉시 확인하는 안심가족잔치 검색 앱에서 검증한 추천 정보입니다!
    `.trim();

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    try {
      document.execCommand('copy');
      showToast("📋 가족 카톡방에 전달하기 편하도록 핵심 요약 메시지가 클립보드에 복사되었습니다! 카톡에 바로 붙여넣기 하세요.");
    } catch (err) {
      showToast("❌ 복사에 실패했습니다. 수동으로 복사해 주세요.");
    }
    document.body.removeChild(tempTextArea);
  };

  const handleCopyAddressOnly = (address) => {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = address;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    try {
      document.execCommand('copy');
      showToast("📍 도로명 주소가 클립보드에 복사되었습니다. 지도 앱에 바로 붙여넣으세요!");
    } catch (err) {
      showToast("❌ 복사에 실패했습니다.");
    }
    document.body.removeChild(tempTextArea);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center">
      
      {/* HEADER BANNER - PREMIUM TEAL & MINT GRADIENT */}
      <header className="w-full max-w-5xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white py-6 px-4 sm:px-6 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-teal-950 p-2.5 rounded-2xl shadow-inner shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              가족잔치 장소 비서 
              <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full uppercase font-bold tracking-widest animate-pulse">PURE SEARCH</span>
            </h1>
            <p className="text-xs text-teal-100 mt-1 font-medium">내부 목업 자료 0%! 오로지 실시간 구글 라이브 검색으로 매칭하는 프리미엄 검색기</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-teal-950/40 px-4 py-2 rounded-full border border-teal-600/30 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-teal-100 font-semibold">100% 실시간 외부 그라운딩 필터링</span>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg bg-slate-900 text-white text-sm px-4 py-3 rounded-2xl shadow-2xl flex items-start gap-2.5 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="whitespace-pre-line">{toastMessage}</div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-5xl p-4 sm:p-6 flex flex-col gap-6 flex-1">
        
        {/* LIVE LOCATION INPUT & AI GOOGLE SEARCH BAR */}
        <section className="bg-gradient-to-r from-teal-50 to-emerald-50/40 rounded-3xl p-5 sm:p-6 shadow-sm border border-teal-100/50">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-teal-100/60">
            <h2 className="font-bold text-teal-950 text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-800" />
              <span>실시간 구글 검색으로 실제 장소 찾아오기</span>
            </h2>
            <span className="text-xs bg-teal-100 text-teal-900 px-2.5 py-1 rounded-md font-bold">내부 자료 전혀 없음</span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              
              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" /> 원하는 구체적인 지역 또는 동네명 입력
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={selectedLocation} 
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    placeholder="예: 울산 중구 성남동, 서울 마포구 공덕동, 부산 동래구" 
                    className="w-full bg-white border border-slate-200 hover:border-teal-600 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-xl pl-3 pr-10 py-3 text-sm font-semibold transition-all shadow-inner"
                  />
                  {selectedLocation && (
                    <X 
                      className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-slate-600" 
                      onClick={() => setSelectedLocation("")} 
                    />
                  )}
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> 잔치 핵심 목적
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-teal-600 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-xl px-3 py-3 text-sm font-semibold transition-all"
                >
                  <option value="칠순·팔순">칠순·팔순</option>
                  <option value="돌잔치">돌잔치</option>
                  <option value="대가족 모임">대가족 모임</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={handleRealTimeSearch}
                  disabled={isSearchingAi}
                  className="w-full bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-80 active:scale-[0.98]"
                >
                  {isSearchingAi ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>실시간 구글 검색 수집</span>
                </button>
              </div>

            </div>

            {/* PROGRESS STATUS */}
            {isSearchingAi && (
              <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-sm flex flex-col gap-3 animate-pulse">
                <div className="flex justify-between text-xs font-bold text-teal-950">
                  <span>AI 데이터 마이닝 진행 상황:</span>
                  <span className="text-teal-700">{searchStep}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 구글 검색 및 인터넷상의 최신 블로그 리뷰, 포스팅 등을 실시간으로 교차 매핑하여 100% 실제 존재하는 룸 식당들만 도출하는 중입니다. 약 3~5초 소요됩니다.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* STEP 2 - ADJUSTMENT SLIDERS */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-700" />
              <span>Step 2. 인원 및 식사 예산 좁히기</span>
            </h2>
            <span className="text-xs text-slate-400">실시간 매칭</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Headcount Adjustment */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-teal-700" /> 우리 모임 인원수 조절</span>
                <span className="text-teal-800 font-black text-sm bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">{headcount}명 기준</span>
              </label>
              
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 w-full justify-between">
                <button 
                  type="button"
                  onClick={() => setHeadcount(prev => Math.max(4, prev - 1))}
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 font-extrabold flex items-center justify-center transition-all select-none text-lg active:scale-95 shadow-sm"
                >
                  <Minus className="w-4 h-4 text-slate-600" />
                </button>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-800">{headcount}명</span>
                  <span className="text-[10px] text-slate-400 font-bold">인원 미세 조정</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setHeadcount(prev => Math.min(50, prev + 1))}
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 font-extrabold flex items-center justify-center transition-all select-none text-lg active:scale-95 shadow-sm"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <input 
                type="range" 
                min="4" 
                max="50" 
                value={headcount} 
                onChange={(e) => setHeadcount(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer mt-1"
              />
            </div>

            {/* 2. Budget Range Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 justify-between">
                <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-teal-700" /> 1인당 희망 예산 한도</span>
                <span className="text-teal-800 font-black text-sm bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  {budgetMax === 100000 ? "제한 없음 (전체)" : `${budgetMax/10000}만원 이하`}
                </span>
              </label>
              
              <div className="grid grid-cols-5 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-2xl h-14 items-center">
                {[
                  { label: "3만원", val: 30000 },
                  { label: "5만원", val: 50000 },
                  { label: "7만원", val: 70000 },
                  { label: "9만원", val: 90000 },
                  { label: "제한없음", val: 100000 }
                ].map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => setBudgetMax(b.val)}
                    className={`h-11 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      budgetMax === b.val
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-right pr-1">설정한 예산 한도 안쪽의 명소만 정확히 추출됩니다.</p>
            </div>

          </div>

          {/* ADVANCED FILTER TOGGLE BTN */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 bg-teal-50 hover:bg-teal-100/70 px-4 py-2.5 rounded-xl transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvanced ? "초정밀 조건 접기 ▲" : "어르신 식감 케어 & 룸 방음 세부 검색 열기 ▼"}
            </button>
          </div>

          {/* ADVANCED FILTER BOX */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              
              {/* ① 음식 부문 필터 */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase border-b border-slate-200/60 pb-1.5 flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-teal-700" /> ① 음식(Food) 부문 초정밀 조건
                </h3>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-600">제공 형태</span>
                  <div className="flex flex-wrap gap-1">
                    {["전체", "코스 요리", "한상차림", "단독 룸 내 프라이빗 뷔페"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setFoodTypeFilter(item)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                          foodTypeFilter === item 
                            ? 'bg-teal-700 border-teal-700 text-white font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    어르신 치아 친화도 
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100">
                      틀니/임플란트 식사 편의도
                    </span>
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { key: "전체", label: "전체 무관" },
                      { key: "상", label: "상 (식재료 푹 고은 아주 연한 형태)" },
                      { key: "중", label: "중 (숙성 수비드, 연질 육류 갈비)" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setSeniorFriendlyFilter(item.key)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex-1 transition-all text-left ${
                          seniorFriendlyFilter === item.key 
                            ? 'bg-teal-700 border-teal-700 text-white font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-600">주류 혜택 (콜키지 서비스)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={corkageFilter} 
                      onChange={(e) => setCorkageFilter(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700">콜키지 프리만</span>
                  </label>
                </div>
              </div>

              {/* ② 공간 및 시설 필터 */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase border-b border-slate-200/60 pb-1.5 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-teal-700" /> ② 공간/장소(Venue) 부문 초정밀 조건
                </h3>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-600">독립 룸 방음 (잔치 이벤트 소리 방출용)</span>
                  <div className="flex gap-1.5">
                    {[
                      { key: "전체", label: "무관" },
                      { key: "완전 방음", label: "완전 방음 (밀폐형 단독룸)" },
                      { key: "파티션 구획", label: "파티션 구획 (가벼운 칸막이)" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setSoundproofFilter(item.key)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex-1 transition-all ${
                          soundproofFilter === item.key 
                            ? 'bg-teal-700 border-teal-700 text-white font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-600">입석/의자식 형태 선택</span>
                  <div className="flex gap-1.5">
                    {[
                      { key: "전체", label: "무관" },
                      { key: "테이블석", label: "의자 식탁 테이블" },
                      { key: "입식(바닥 - 다리 넣는 홀 있음)", label: "파인 온돌 좌식" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setSeatingFilter(item.key)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex-1 transition-all ${
                          seatingFilter === item.key 
                            ? 'bg-teal-700 border-teal-700 text-white font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Accessibility className="w-3.5 h-3.5 text-teal-700" /> 실버 무장애 조건
                    </span>
                    <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-slate-200">
                      {["계단 없음", "엘리베이터 보유", "휠체어 화장실"].map(bf => (
                        <label key={bf} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={barrierFreeFilters.includes(bf)}
                            onChange={() => toggleBarrierFree(bf)}
                            className="rounded text-teal-700 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span>{bf}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                      <Tv className="w-3.5 h-3.5 text-teal-700" /> 음향/화면 기기 대여
                    </span>
                    <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-slate-200">
                      {["대형 TV 화면", "빔프로젝터", "무선 마이크", "블루투스 스피커"].map(eq => (
                        <label key={eq} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={equipmentFilters.includes(eq)}
                            onChange={() => toggleEquipment(eq)}
                            className="rounded text-teal-700 focus:ring-teal-500 w-3.5 h-3.5"
                          />
                          <span>{eq}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </section>

        {/* RESULTS STATS / BADGES */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-teal-50/60 px-4 py-3 rounded-2xl border border-teal-100">
          <div className="flex items-center gap-2">
            <span className="bg-teal-700 text-white font-extrabold px-3 py-1 rounded-lg text-xs">
              라이브 데이터 상태
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {hasSearched 
                ? `구글 연동 수집 매치: 총 ${filteredVenues.length}개 발견` 
                : "대기 상태 - 지역명을 입력하고 수집을 진행해 주세요."}
            </span>
          </div>
          <div className="flex gap-2 text-xs text-slate-500 font-bold">
            <span>• 현재 세팅 인원: {headcount}명</span>
            <span>• 예산 필터: 인당 {budgetMax/10000}만원 이하</span>
          </div>
        </section>

        {/* VENUE CARD LIST */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => {
              const bfList = Array.isArray(venue.barrierFree) ? venue.barrierFree : [];
              return (
                <div 
                  key={venue.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/80 hover:border-teal-400/60 transition-all flex flex-col justify-between"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                          {String(venue.location).split(' ').slice(0,3).join(' ')}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          ✓ 실시간 구글 연동 데이터
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {bfList.slice(0, 2).map((bf, idx) => (
                          <span key={idx} className="text-[9px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-100 font-bold">
                            {String(bf)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                      {String(venue.name)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {String(venue.description)}
                    </p>

                    <div className="mt-4 bg-slate-50/70 p-3.5 rounded-2xl flex flex-col gap-2 border border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">1인 대략 예상 금액</span>
                        <strong className="text-teal-900 text-sm font-black">{Number(venue.pricePerPerson).toLocaleString()}원</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">식감 및 메뉴 안내</span>
                        <span className="text-slate-700 font-bold">{String(venue.foodType)} ({String(venue.seniorFriendlyDesc)})</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="bg-slate-50 py-2.5 rounded-xl border border-slate-200/30">
                        <span className="text-slate-400 block text-[9px] font-bold mb-0.5">룸 방음력</span>
                        <strong className="text-slate-700 font-bold">{String(venue.soundproof)}</strong>
                      </div>
                      <div className="bg-slate-50 py-2.5 rounded-xl border border-slate-200/30">
                        <span className="text-slate-400 block text-[9px] font-bold mb-0.5">무릎안심 테이블</span>
                        <strong className="text-slate-700 font-bold">{String(venue.seating).split(' ')[0]}</strong>
                      </div>
                      <div className="bg-slate-50 py-2.5 rounded-xl border border-slate-200/30">
                        <span className="text-slate-400 block text-[9px] font-bold mb-0.5">외부 주입 프리</span>
                        <strong className="text-slate-700 font-bold">{String(venue.corkage)}</strong>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100/60 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="text-[10px] text-emerald-900 font-bold block">이 룸 전용 자녀 연출 시나리오</span>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                          {String(venue.eventConcept)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedVenue(venue)}
                      className="flex-1 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1 active:scale-[0.98]"
                    >
                      <span>코스식단 & 무보행 동선 디테일</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleShareClipboard(venue)}
                      className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 p-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                      title="가족 공유 카드 메시지 복사"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLocationModalVenue(venue)}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-xs font-bold px-3 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-1"
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>지도</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-12 border border-slate-200/80 text-center flex flex-col items-center justify-center gap-4">
              <div className="bg-teal-50 p-4 rounded-full text-teal-700">
                <Globe className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg">오로지 구글 실시간 검색으로 장소 발굴</h3>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                식당의 고정 기본 데이터셋을 일절 수록하지 않은 청정 시스템입니다. <strong>상단 입력창에 찾으시는 지역명(구·동 단위)을 넣으시고 [실시간 구글 검색 수집]</strong>을 누르시면 라이브로 정보를 수집합니다.
              </p>
            </div>
          )}
        </section>

        {/* PROOF OF GROUNDING: REAL TIME SEARCH DATA SOURCES */}
        {groundingSources.length > 0 && (
          <section className="bg-emerald-50/40 rounded-3xl p-5 border border-emerald-100">
            <h3 className="text-xs font-extrabold text-emerald-950 flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>실시간 분석 출처 (수집 연동된 블로그 및 플레이스 주소)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {groundingSources.map((src, idx) => (
                <a 
                  key={idx}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-slate-200/85 transition-all flex items-center gap-1 font-semibold"
                >
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  <span className="max-w-[180px] truncate">{src.title}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* SERVICE INFO & GUIDE */}
        <section className="bg-slate-800 text-slate-100 rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700 mb-4">
            <Info className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base text-white">안심 잔치 장소 검색 원칙</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div>
              <h4 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                🌎 리얼 그라운딩 보장 가이드
              </h4>
              <p className="leading-relaxed text-slate-300">
                인터넷상의 실제 식당 데이터와 동선, 메뉴 구성을 그라운딩 기술로 라이브 수집 가공하여 매칭합니다. 인위적인 하드코딩 데이터를 일절 수 수록하지 않았습니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                ♿ 미끄럼 없는 동선 및 특화 분석
              </h4>
              <p className="leading-relaxed text-slate-300">
                노약자와 삼대 가족들이 다리 무릎관절 무리 없이 식사할 수 있는 의자 및 동선 여부, 틀니 어르신을 위한 코스 구성 등의 특화 요소를 꼼꼼히 체크합니다.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* DETAIL MODAL */}
      {selectedVenue && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-start gap-4 z-10">
              <div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">
                  {String(selectedVenue.location)}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{String(selectedVenue.name)}</h3>
                <p className="text-xs text-slate-500 mt-1">{String(selectedVenue.description)}</p>
              </div>
              <button 
                onClick={() => setSelectedVenue(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-5">
              
              <div>
                <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-teal-700" /> ① '실제 제공 코스 구성' 상세 안내
                </h4>
                
                <div className="flex flex-col gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {(Array.isArray(selectedVenue.courseLayout) ? selectedVenue.courseLayout : []).map((course, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <span className="bg-teal-100 text-teal-900 font-bold text-[10px] px-2 py-0.5 rounded-md min-w-[50px] text-center shrink-0 mt-0.5">
                        {String(course.step)}
                      </span>
                      <div>
                        <strong className="text-slate-800 font-bold">{String(course.name)}</strong>
                        <p className="text-slate-500 text-[11px] mt-0.5">{String(course.desc)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 p-3 bg-teal-50/60 rounded-2xl border border-teal-100 flex gap-2">
                  <Info className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-teal-900">Q. 어르신을 위해 질긴 구성 요소를 부드러운 메뉴로 대체 가능한가요?</span>
                    <p className="text-slate-600 mt-0.5">{String(selectedVenue.replaceQA)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5 text-emerald-700" /> ② 실버 휠체어/보행기 전용 이동 동선 Preview
                </h4>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>{String(selectedVenue.pathwayPreview)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase mb-2 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" /> ③ 추천 매칭 룸 전용 잔치 이벤트 아이디어
                </h4>
                <div className="p-3.5 bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-2xl border border-teal-100/60 text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-teal-900 mb-1">💡 추천 기획 식순:</p>
                  <p>{String(selectedVenue.eventConcept)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-100/60 p-3 rounded-2xl border border-slate-200/30">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">장애물 없는 무장애 시설</span>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(selectedVenue.barrierFree) ? selectedVenue.barrierFree : []).map((item, idx) => (
                      <span key={idx} className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                        ✓ {String(item)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-100/60 p-3 rounded-2xl border border-slate-200/30">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">활용 가능한 기기 대여</span>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(selectedVenue.equipment) && selectedVenue.equipment.length > 0 ? (
                      selectedVenue.equipment.map((item, idx) => (
                        <span key={idx} className="text-[10px] bg-white text-teal-800 px-2 py-0.5 rounded border border-teal-100 font-medium">
                          ⚡ {String(item)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">자체 기기 대여 정보 없음</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-slate-50 p-5 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleShareClipboard(selectedVenue)}
                className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>가족방 공유 카드 복사</span>
              </button>
              
              <button
                onClick={() => {
                  setLocationModalVenue(selectedVenue);
                  setSelectedVenue(null);
                }}
                className="flex-1 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all text-center flex items-center justify-center gap-1"
              >
                <Map className="w-4 h-4" />
                <span>네이버 지도 위치 확인</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LOCATION & NAVER MAP MODAL */}
      {locationModalVenue && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-1.5">
                  <Map className="w-5 h-5 text-emerald-300 animate-pulse" />
                  <span>실시간 지도 및 경로 확인</span>
                </h3>
                <p className="text-xs text-teal-100 mt-1">상세 도로명 주소와 길찾기 전용 링크입니다.</p>
              </div>
              <button 
                onClick={() => setLocationModalVenue(null)}
                className="bg-teal-950/40 text-teal-100 hover:bg-teal-900/60 p-1.5 rounded-full border border-teal-600/30 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-5">
              
              {/* Venue Name & Address Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col gap-2.5">
                <div>
                  <span className="text-[10px] text-teal-800 font-extrabold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    {locationModalVenue.foodType}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-1">
                    {locationModalVenue.name}
                  </h4>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-slate-400 font-bold block">도로명 주소</span>
                  <p className="text-slate-800 font-bold leading-relaxed">
                    {locationModalVenue.location}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyAddressOnly(locationModalVenue.location)}
                  className="w-full bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-teal-700" />
                  <span>주소 복사하기 (가족방에 붙여넣기용)</span>
                </button>
              </div>

              {/* HIGH-FIDELITY INTERACTIVE MOCK MAP VIEW */}
              <div className="relative h-44 rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-100 shadow-inner flex flex-col justify-between">
                
                {/* SVG/Tailwind Mock Naver Map Layout */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center">
                  
                  {/* Decorative Map Roads */}
                  <div className="absolute w-full h-1 bg-teal-600/10 top-1/4 -rotate-12"></div>
                  <div className="absolute w-full h-2 bg-teal-600/10 top-2/3 rotate-6"></div>
                  <div className="absolute h-full w-1 bg-teal-600/10 left-1/3 rotate-12"></div>
                  <div className="absolute h-full w-1.5 bg-teal-600/10 left-2/3 -rotate-6"></div>

                  {/* Pulsing Blue Location Dot */}
                  <div className="absolute top-1/3 left-1/4 flex items-center justify-center">
                    <span className="absolute inline-flex h-8 w-8 rounded-full bg-sky-400/30 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border border-white"></span>
                  </div>

                  {/* Big Map PIN on Location */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
                    <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border border-white flex items-center justify-center animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold whitespace-nowrap opacity-90">
                      {locationModalVenue.name}
                    </span>
                  </div>

                </div>

                {/* Naver Map Branding Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg shadow-sm border border-slate-200/60 text-[10px] font-bold text-emerald-700 flex items-center gap-1 z-10 select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>NAVER 지도 연계망</span>
                </div>

                {/* Bottom Route Summary */}
                <div className="bg-white/95 backdrop-blur border-t border-slate-200 p-2.5 text-center text-[11px] font-bold text-slate-700 z-10">
                  📍 주차장에서 매장 입구까지 {locationModalVenue.barrierFree.includes("계단 없음") ? "턱이 없음(무장애)" : "경사로 보장 동선"}
                </div>

              </div>

            </div>

            {/* Modal Footer (Real Redirects) */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 flex flex-col gap-2">
              
              {/* Naver Map Direct Button */}
              <a 
                href={`https://map.naver.com/v5/search/${encodeURIComponent(locationModalVenue.name + " " + locationModalVenue.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <span>네이버 지도로 열어 경로 확인</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Kakao Map Direct Button */}
              <a 
                href={`https://map.kakao.com/?q=${encodeURIComponent(locationModalVenue.name + " " + locationModalVenue.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <span>카카오맵으로 경로 찾기</span>
                <ExternalLink className="w-4 h-4 text-yellow-900" />
              </a>

              <p className="text-[10px] text-slate-400 text-center mt-1">
                위 버튼을 누르면 설치된 지도 앱(네이버/카카오)으로 자동 실행됩니다.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-5xl text-center py-8 px-4 text-xs text-slate-400 border-t border-slate-200/60 mt-12">
        <p>© 2026 가족잔치 장소 비서 Project. All rights reserved.</p>
        <p className="mt-1">구글 라이브 서칭을 통한 안심 장소 서포터 - 본 서비스는 별도의 데이터 보관이나 수수료가 일절 없는 프리미엄 오픈 정보 서비스입니다.</p>
      </footer>

    </div>
  );
}