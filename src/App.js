import React, { useState, useEffect, useMemo, useRef } from "react";
// Lock 등 사용하지 않는 아이콘 제거
import {
  MapPin,
  Navigation,
  Info,
  Users,
  Calendar,
  X,
  Star,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageCircle,
  Send,
  Plus,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  increment,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

// ============================================================================
// [필수 수정 영역] Firebase 설정
// ============================================================================
const MY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC5gm66AkgtD4H154CuJ0eaRLoNyRiVjhk",
  authDomain: "daejeon-87abc.firebaseapp.com",
  projectId: "daejeon-87abc",
  storageBucket: "daejeon-87abc.firebasestorage.app",
  messagingSenderId: "802822511974",
  appId: "1:802822511974:web:93fd247437c7ea7e63bca7",
};

// 환경 변수 처리 (JS에서는 declare 구문 없이 typeof로 체크)
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : MY_FIREBASE_CONFIG;

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
// ============================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Date utility for daily stats key
const getTodayDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getHourKey = (offsetHours = 0) => {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}`;
};

// Initial Data for Seeding
const initialDistrictsData = [
  {
    id: "1",
    name: "소제동 카페거리",
    description:
      "과거 철도 관사촌의 낭만과 현대적인 감성이 어우러진 핫플레이스입니다. 독특한 카페와 맛집이 골목마다 숨어있습니다.",
    tags: ["카페", "사진명소", "데이트"],
    image:
      "https://images.unsplash.com/photo-1596627622998-150992383188?auto=format&fit=crop&q=80&w=800",
    district: "동구",
    views: 0,
    rating: 4.5,
  },
  {
    id: "2",
    name: "식장산 전망대",
    description:
      "대전의 야경을 한눈에 담을 수 있는 최고의 명소입니다. 드라이브 코스로도 유명하며 탁 트인 도심 풍경이 일품입니다.",
    tags: ["야경", "드라이브", "전망대"],
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=800",
    district: "동구",
    views: 0,
    rating: 4.8,
  },
  {
    id: "3",
    name: "대동 하늘공원",
    description:
      "알록달록한 벽화마을 위 풍차와 함께 대전 시내를 조망할 수 있는 낭만적인 공원입니다. 일몰 시간에 특히 아름답습니다.",
    tags: ["일몰", "산책", "벽화마을"],
    image:
      "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&q=80&w=800",
    district: "동구",
    views: 0,
    rating: 4.6,
  },
  {
    id: "4",
    name: "성심당 본점",
    description:
      "대전의 자부심, 튀김소보로의 본가입니다. 빵지순례의 필수 코스로 은행동 으능정이 거리에 위치해 있습니다.",
    tags: ["맛집", "빵지순례", "문화유산"],
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
    district: "중구",
    views: 0,
    rating: 4.9,
  },
  {
    id: "5",
    name: "대전 오월드",
    description:
      "동물원, 플라워랜드, 조이랜드가 결합된 종합 테마파크입니다. 가족 단위 나들이 장소로 가장 인기가 많습니다.",
    tags: ["테마파크", "가족여행", "동물원"],
    image:
      "https://images.unsplash.com/photo-1558522338-d9d37533605e?auto=format&fit=crop&q=80&w=800",
    district: "중구",
    views: 0,
    rating: 4.4,
  },
  {
    id: "6",
    name: "보문산 숲치유센터",
    description:
      "도심 속에서 숲을 즐길 수 있는 힐링 공간입니다. 산책로가 잘 조성되어 있어 가볍게 등산하기 좋습니다.",
    tags: ["힐링", "등산", "자연"],
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800",
    district: "중구",
    views: 0,
    rating: 4.3,
  },
  {
    id: "7",
    name: "한밭수목원",
    description:
      "도심 한복판에 위치한 국내 최대 규모의 인공 수목원입니다. 동원과 서원, 열대식물원 등 다양한 볼거리가 있습니다.",
    tags: ["수목원", "피크닉", "자연"],
    image:
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=800",
    district: "서구",
    views: 0,
    rating: 4.7,
  },
  {
    id: "8",
    name: "장태산 자연휴양림",
    description:
      "울창한 메타세쿼이아 숲이 장관을 이루는 곳입니다. 스카이웨이를 걸으며 피톤치드를 만끽할 수 있습니다.",
    tags: ["휴양림", "메타세쿼이아", "힐링"],
    image:
      "https://images.unsplash.com/photo-1623944893781-a9f987258411?auto=format&fit=crop&q=80&w=800",
    district: "서구",
    views: 0,
    rating: 4.8,
  },
  {
    id: "9",
    name: "둔산동 타임월드",
    description:
      "대전의 트렌드가 모이는 중심 상권입니다. 쇼핑, 맛집, 문화생활을 한 번에 즐길 수 있는 번화가입니다.",
    tags: ["쇼핑", "도시", "맛집"],
    image:
      "https://images.unsplash.com/photo-1533658299863-71887e076633?auto=format&fit=crop&q=80&w=800",
    district: "서구",
    views: 0,
    rating: 4.2,
  },
  {
    id: "10",
    name: "엑스포 과학공원",
    description:
      "한빛탑 미디어파사드와 음악분수가 유명합니다. 과학 도시 대전의 상징과도 같은 곳입니다.",
    tags: ["야경", "과학", "분수쇼"],
    image:
      "https://images.unsplash.com/photo-1565060169190-6218d96b4e3f?auto=format&fit=crop&q=80&w=800",
    district: "유성구",
    views: 0,
    rating: 4.6,
  },
  {
    id: "11",
    name: "유성온천 족욕체험장",
    description:
      "누구나 무료로 이용할 수 있는 야외 족욕 체험장입니다. 여행의 피로를 풀기에 안성맞춤입니다.",
    tags: ["온천", "휴식", "무료"],
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800",
    district: "유성구",
    views: 0,
    rating: 4.5,
  },
  {
    id: "12",
    name: "국립중앙과학관",
    description:
      "아이들과 함께하기 좋은 국내 대표 과학관입니다. 다양한 전시와 체험 프로그램을 운영합니다.",
    tags: ["교육", "아이와함께", "박물관"],
    image:
      "https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=800",
    district: "유성구",
    views: 0,
    rating: 4.7,
  },
  {
    id: "13",
    name: "계족산 황토길",
    description:
      "맨발로 걷는 즐거움이 있는 황토길입니다. 한국관광 100선에 선정될 만큼 걷기 좋은 길입니다.",
    tags: ["맨발걷기", "트레킹", "건강"],
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800",
    district: "대덕구",
    views: 0,
    rating: 4.8,
  },
  {
    id: "14",
    name: "대청댐 물문화관",
    description:
      "대청호의 시원한 풍광을 감상할 수 있습니다. 주변 산책로와 드라이브 코스가 아름답습니다.",
    tags: ["댐", "드라이브", "풍경"],
    image:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800",
    district: "대덕구",
    views: 0,
    rating: 4.5,
  },
  {
    id: "15",
    name: "동춘당 공원",
    description:
      "조선시대의 고풍스러운 멋을 느낄 수 있는 고택과 공원입니다. 도심 속 고즈넉한 산책을 즐기기 좋습니다.",
    tags: ["역사", "산책", "문화재"],
    image:
      "https://images.unsplash.com/photo-1597825006277-22f2b36f1c41?auto=format&fit=crop&q=80&w=800",
    district: "대덕구",
    views: 0,
    rating: 4.4,
  },
];

// --- Components ---

const VisitorStatsCard = ({ daily, total }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
      <h3 className="font-bold text-lg flex items-center">
        <TrendingUp className="mr-2" size={20} />
        실시간 방문 현황
      </h3>
      <p className="text-emerald-100 text-xs mt-1">대전 여행을 함께하는 분들</p>
    </div>
    <div className="p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <Calendar size={20} />
          </div>
          <span className="text-sm font-medium text-gray-600">오늘 방문자</span>
        </div>
        <span className="text-xl font-bold text-gray-900">
          {daily.toLocaleString()}
        </span>
      </div>

      <div className="h-px bg-gray-100 w-full"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Users size={20} />
          </div>
          <span className="text-sm font-medium text-gray-600">누적 방문자</span>
        </div>
        <span className="text-xl font-bold text-gray-900">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
    <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
      <span className="text-xs text-gray-400">
        데이터는 실시간으로 집계됩니다
      </span>
    </div>
  </div>
);

const ChatWidget = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const chatRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "chat_messages"
    );

    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      msgs.sort((a, b) => a.createdAt - b.createdAt);
      setMessages(msgs.slice(-50));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText;
    setInputText("");

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "chat_messages"),
        {
          text: text,
          createdAt: Date.now(),
          userId: user.uid,
          color: "#" + user.uid.slice(0, 6),
        }
      );
    } catch (err) {
      console.error("Failed to send message", err);
      setInputText(text);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[400px]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white flex justify-between items-center">
        <h3 className="font-bold text-sm flex items-center">
          <MessageCircle size={16} className="mr-2" />
          실시간 여행 톡
        </h3>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-10">
            첫 메시지를 남겨보세요! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user?.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs shadow-sm ${
                    isMe
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-2 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지 입력..."
          className="flex-1 text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

const PlaceCard = ({ place, onClick, isAdmin, onEdit, onDelete }) => (
  <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer relative">
    {isAdmin && (
      <div className="absolute top-3 left-3 z-20 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(place);
          }}
          className="p-1.5 bg-white/90 rounded-full text-blue-600 hover:bg-blue-100 shadow-sm"
          title="수정"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(place.id);
          }}
          className="p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-red-100 shadow-sm"
          title="삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )}

    <div
      className="relative h-48 overflow-hidden"
      onClick={() => onClick(place.id)}
    >
      <img
        src={place.image || "https://via.placeholder.com/800x400?text=No+Image"}
        alt={place.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/800x400?text=Image+Error";
        }}
      />
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-emerald-600 shadow-sm flex items-center">
        <Star size={12} className="mr-1 fill-emerald-600" />
        추천
      </div>
      {place.district && (
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur px-2 py-1 rounded-md text-xs font-medium text-white shadow-sm">
          {place.district}
        </div>
      )}
    </div>
    <div className="p-5 flex-1 flex flex-col" onClick={() => onClick(place.id)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
          {place.name}
        </h3>
        <div className="flex items-center text-yellow-500 text-sm font-bold bg-yellow-50 px-1.5 py-0.5 rounded">
          <Star size={14} className="fill-yellow-500 mr-1" />
          {place.rating}
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
        {place.description}
      </p>

      <div className="flex items-center text-xs text-gray-400 mb-3 space-x-3">
        <span className="flex items-center">
          <Eye size={14} className="mr-1" /> {place.views.toLocaleString()}
        </span>
        <span className="w-px h-3 bg-gray-200"></span>
        <span className="flex items-center">
          <ThumbsUp size={14} className="mr-1" />{" "}
          {Math.floor(place.views * 0.1).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        {place.tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// --- Write/Edit Modal ---
const PlaceFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    district: "동구",
    tags: "",
    rating: 4.5,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tags: initialData.tags.join(", "),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        image:
          "https://images.unsplash.com/photo-1596627622998-150992383188?auto=format&fit=crop&q=80&w=800",
        district: "동구",
        tags: "",
        rating: 4.5,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      rating: Number(formData.rating),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {initialData ? "여행지 수정" : "새 여행지 등록"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              여행지 이름
            </label>
            <input
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구 선택
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
              value={formData.district}
              onChange={(e) =>
                setFormData({ ...formData, district: e.target.value })
              }
            >
              {["동구", "중구", "서구", "유성구", "대덕구"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <ImageIcon size={14} className="mr-1" />
              이미지 URL (첨부)
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              placeholder="https://... (이미지 주소를 입력하세요)"
            />
            {/* 이미지 미리보기 추가 */}
            {formData.image && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-200 h-40 bg-gray-50">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) =>
                    (e.target.src =
                      "https://via.placeholder.com/400x200?text=Invalid+Image+URL")
                  }
                />
                <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                  미리보기
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              태그 (쉼표로 구분)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="카페, 야경, 데이트"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              평점 (0.0 ~ 5.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.rating}
              onChange={(e) =>
                setFormData({ ...formData, rating: parseFloat(e.target.value) })
              }
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors mt-4"
          >
            {initialData ? "수정 완료" : "등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function DaejeonTravelApp() {
  const [activeTab, setActiveTab] = useState("전체");
  const [sortBy, setSortBy] = useState("recommendation");
  const [visitorStats, setVisitorStats] = useState({ daily: 0, total: 0 });
  const [user, setUser] = useState(null);
  const [trendingPlaces, setTrendingPlaces] = useState([]);

  // New States for Admin & Data
  const [places, setPlaces] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [headerImage, setHeaderImage] = useState(
    "https://images.unsplash.com/photo-1627960682701-7b001a140228?auto=format&fit=crop&q=80&w=1600"
  );

  // 1. Auth & Initial Setup
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Custom token sign in failed", e);
          await signInAnonymously(auth);
        }
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch Header Image from Config
  useEffect(() => {
    if (!user) return;
    const configRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "config",
      "global"
    );
    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists() && snapshot.data().headerImage) {
        setHeaderImage(snapshot.data().headerImage);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleUpdateHeaderImage = async () => {
    if (!isAdmin) return;
    const newUrl = prompt("새로운 배경 이미지 URL을 입력하세요:", headerImage);
    if (newUrl && newUrl !== headerImage) {
      try {
        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "config", "global"),
          {
            headerImage: newUrl,
          },
          { merge: true }
        );
      } catch (e) {
        alert("이미지 변경 실패");
      }
    }
  };

  // 2. Fetch Places from Firestore
  useEffect(() => {
    if (!user) return;

    const q = collection(db, "artifacts", appId, "public", "data", "places");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPlaces = [];
      snapshot.forEach((doc) => {
        loadedPlaces.push({ id: doc.id, ...doc.data() });
      });
      setPlaces(loadedPlaces);
    });
    return () => unsubscribe();
  }, [user]);

  // Admin Login Logic (Simple Simulation)
  const handleAdminLogin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    const password = prompt("관리자 비밀번호를 입력하세요 (데모: 1234)");
    if (password === "1234") {
      setIsAdmin(true);
      alert("관리자 모드로 전환되었습니다. 이제 글을 쓰고 수정할 수 있습니다.");
    } else if (password !== null) {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  // Seed Initial Data
  const seedData = async () => {
    if (!isAdmin) return;
    if (!confirm("초기 데이터를 데이터베이스에 업로드하시겠습니까?")) return;

    const batch = writeBatch(db);
    const collectionRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "places"
    );

    initialDistrictsData.forEach((place) => {
      const docRef = doc(collectionRef);
      const { id, ...data } = place;
      batch.set(docRef, data);
    });

    try {
      await batch.commit();
      alert("초기 데이터 업로드 완료!");
    } catch (e) {
      console.error("Seeding failed", e);
      alert("업로드 실패 (콘솔 확인)");
    }
  };

  // CRUD Operations
  const handleAddPlace = async (data) => {
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "places"),
        {
          ...data,
          views: 0,
        }
      );
      setIsModalOpen(false);
    } catch (e) {
      alert("등록 실패");
    }
  };

  const handleUpdatePlace = async (data) => {
    if (!editingPlace) return;
    try {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "places",
          editingPlace.id
        ),
        data
      );
      setIsModalOpen(false);
      setEditingPlace(null);
    } catch (e) {
      alert("수정 실패");
    }
  };

  const handleDeletePlace = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "places", id)
      );
    } catch (e) {
      alert("삭제 실패");
    }
  };

  // 3. Visitor Stats
  useEffect(() => {
    if (!user) return;
    const statsRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "visitor_stats_v2",
      "counts"
    );
    const todayStr = getTodayDateString();

    const incrementVisit = async () => {
      const sessionKey = `visited_${todayStr}`;
      const hasVisited = sessionStorage.getItem(sessionKey);

      if (!hasVisited) {
        try {
          await setDoc(
            statsRef,
            {
              total: increment(1),
              [`daily_${todayStr}`]: increment(1),
            },
            { merge: true }
          );
          sessionStorage.setItem(sessionKey, "true");
        } catch (e) {
          console.error("Visitor count failed: ", e);
        }
      }
    };
    incrementVisit();

    const unsubscribeSnapshot = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setVisitorStats({
          daily: data[`daily_${todayStr}`] || 0,
          total: data.total || 0,
        });
      }
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  // 4. Trending Logic
  useEffect(() => {
    if (!user) return;
    const currentHourKey = getHourKey(0);
    const prevHourKey = getHourKey(-1);
    const trendingRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "trending",
      currentHourKey
    );
    const prevTrendingRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "trending",
      prevHourKey
    );

    let prevData = {};
    getDoc(prevTrendingRef).then((snap) => {
      if (snap.exists()) prevData = snap.data();
    });

    const unsubscribe = onSnapshot(trendingRef, (snap) => {
      const currentData = snap.exists() ? snap.data() : {};
      const sorted = Object.entries(currentData)
        .map(([id, count]) => ({
          id,
          count: count,
          prevCount: prevData[id] || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const processed = sorted.map((item) => {
        // Find name in current places list
        const found = places.find((p) => p.id === item.id);
        return {
          name: found ? found.name : "알 수 없는 장소",
          diff: item.count - item.prevCount,
          current: item.count,
        };
      });
      setTrendingPlaces(processed);
    });
    return () => unsubscribe();
  }, [user, places]);

  const handlePlaceClick = async (placeId) => {
    if (!user) return;
    const hourKey = getHourKey(0);
    const trendingRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "trending",
      hourKey
    );
    try {
      await setDoc(trendingRef, { [placeId]: increment(1) }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  // Categories
  // Derive districts from the dynamic data
  const dynamicDistricts = useMemo(() => {
    // Cleaned up unused variables
    return ["전체", "동구", "중구", "서구", "유성구", "대덕구"];
  }, [places]);

  const displayedPlaces = useMemo(() => {
    let filtered =
      activeTab === "전체"
        ? places
        : places.filter((p) => p.district === activeTab);
    return filtered.sort((a, b) => {
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [places, activeTab, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveTab("전체")}
            >
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                <MapPin size={20} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                대전여행 가이드
              </span>
            </div>

            <button
              onClick={handleAdminLogin}
              className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                isAdmin
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {isAdmin ? (
                <>
                  <LogOut size={16} className="mr-1.5" /> 관리자 종료
                </>
              ) : (
                <>
                  <LogIn size={16} className="mr-1.5" /> 관리자 로그인
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-emerald-900 overflow-hidden group">
        <div className="absolute inset-0 opacity-40 transition-opacity duration-700">
          <img
            src={headerImage}
            alt="Daejeon Background"
            className="w-full h-full object-cover transition-all duration-1000"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-transparent to-transparent"></div>

        {/* Admin Edit Header Button */}
        {isAdmin && (
          <button
            onClick={handleUpdateHeaderImage}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full text-xs flex items-center backdrop-blur-sm transition-all"
          >
            <Camera size={14} className="mr-1.5" /> 배경 수정
          </button>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            과학과 자연이 어우러진 도시, <br className="hidden sm:block" />
            <span className="text-emerald-300">대전으로 오세요!</span>
          </h1>
          <p className="text-emerald-100 text-lg sm:text-xl max-w-2xl mx-auto font-light mb-8">
            동구의 낭만부터 유성의 힐링까지, 대전 5개 구의 다채로운 매력을
            소개합니다.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <VisitorStatsCard
              daily={visitorStats.daily}
              total={visitorStats.total}
            />

            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 hidden lg:block">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-blue-900 text-sm">
                  🔥 실시간 인기 급상승
                </h4>
              </div>
              <div className="space-y-3">
                {trendingPlaces.length > 0 ? (
                  trendingPlaces.map((place, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-xs items-center"
                    >
                      <span className="text-gray-700 font-medium truncate w-24">
                        {index + 1}. {place.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">
                          {place.current} view
                        </span>
                        {place.diff > 0 ? (
                          <span className="font-bold text-red-500 text-[10px]">
                            ▲ {place.diff}
                          </span>
                        ) : place.diff < 0 ? (
                          <span className="font-bold text-blue-500 text-[10px]">
                            ▼ {Math.abs(place.diff)}
                          </span>
                        ) : (
                          <span className="font-bold text-gray-400 text-[10px]">
                            -
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-500 py-4">
                    아직 집계된 데이터가 없습니다.
                    <br />
                    여행지를 클릭해보세요!
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <ChatWidget user={user} />
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            {/* Admin Controls */}
            {isAdmin && places.length === 0 && (
              <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                <p className="text-yellow-800 mb-3 font-medium">
                  데이터베이스에 여행지 정보가 없습니다.
                </p>
                <button
                  onClick={seedData}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600"
                >
                  기본 데이터 업로드하기
                </button>
              </div>
            )}

            {/* Category Navigation */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Navigation size={24} className="mr-2 text-emerald-600" />
                어디로 떠나볼까요?
              </h2>
              <div className="flex flex-wrap gap-2">
                {dynamicDistricts.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      activeTab === category
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-100"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <p className="text-gray-500 text-sm w-full sm:w-auto text-center sm:text-left">
                총{" "}
                <span className="font-bold text-emerald-600">
                  {displayedPlaces.length}
                </span>
                개의 여행지가 기다리고 있습니다.
              </p>

              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-full sm:w-auto">
                <button
                  onClick={() => setSortBy("recommendation")}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sortBy === "recommendation"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  추천순
                </button>
                <button
                  onClick={() => setSortBy("views")}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sortBy === "views"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  인기순
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sortBy === "rating"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  평점순
                </button>
              </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onClick={(id) => handlePlaceClick(id)}
                  isAdmin={isAdmin}
                  onEdit={(p) => {
                    setEditingPlace(p);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeletePlace}
                />
              ))}
              {/* Add New Place Card (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingPlace(null);
                    setIsModalOpen(true);
                  }}
                  className="group border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all h-[360px]"
                >
                  <div className="p-4 bg-gray-100 rounded-full group-hover:bg-emerald-100 mb-4 transition-colors">
                    <Plus size={32} />
                  </div>
                  <span className="font-bold">새 여행지 등록</span>
                </button>
              )}
            </div>

            {/* Travel Tips */}
            <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  알아두면 좋은 대전 여행 팁
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
                    대전의 공영 자전거 '타슈'는 1시간 무료로 이용 가능합니다.
                    앱을 미리 설치하세요!
                  </li>
                  <li className="flex items-center">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
                    성심당 방문 시 '테이블링' 앱으로 대기 현황을 확인하면
                    편리합니다.
                  </li>
                  <li className="flex items-center">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
                    매달 축제가 열리는 엑스포 시민광장 일정을 미리 체크해보세요.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <MapPin size={24} className="text-emerald-500" />
            <span className="text-xl font-bold text-white">
              대전여행 가이드
            </span>
          </div>
          <p className="text-sm mb-6">대전의 아름다움, 당신의 일상이 됩니다.</p>
          <div className="flex justify-center gap-4 text-xs">
            <span className="px-2 py-1 bg-gray-800 rounded">React</span>
            <span className="px-2 py-1 bg-gray-800 rounded">Firebase</span>
            <span className="px-2 py-1 bg-gray-800 rounded">Tailwind</span>
          </div>
          <div className="mt-8 text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Daejeon Travel Guide. All rights
            reserved.
          </div>
        </div>
      </footer>

      {/* Edit/Create Modal */}
      <PlaceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingPlace ? handleUpdatePlace : handleAddPlace}
        initialData={editingPlace}
      />
    </div>
  );
}
