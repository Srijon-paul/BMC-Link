import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Camera,
  Sparkles,
  Upload,
  Layers,
  Check,
  Loader2,
  Trash2,
  Search,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { updateProfile } from "@/lib/account";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { compressImage } from "@/lib/imageCompressor";

interface Props {
  isOpen: boolean;
  currentAvatar?: string | null;
  displayName?: string;
  onClose: () => void;
  onSuccess?: (newUrl: string | null) => void;
}

type CategoryType = "all" | "3d" | "portraits" | "notion" | "cyber" | "gradients";

interface AvatarItem {
  id: string;
  label: string;
  category: "3d" | "portraits" | "notion" | "cyber" | "gradients";
  url: string;
  badge?: string;
}

// ── Curated Premium Avatar Library ─────────────────────────────────────────────
const AVATAR_LIBRARY: AvatarItem[] = [
  // 🌟 3D Characters & Memojis
  {
    id: "3d-1",
    label: "Cyber Punk",
    category: "3d",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=820ad1,b6e3f4&hair=short01,short02&accessories=sunglasses",
    badge: "Popular",
  },
  {
    id: "3d-2",
    label: "Aria Glow",
    category: "3d",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=ffdfbf,ffd5dc,d1d4f9",
    badge: "Trending",
  },
  {
    id: "3d-3",
    label: "Neon Scout",
    category: "3d",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=c0aede,ffdfbf&accessories=glasses",
  },
  {
    id: "3d-4",
    label: "Cosmic Girl",
    category: "3d",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Bella&backgroundColor=b6e3f4,c0aede",
  },
  {
    id: "3d-5",
    label: "Vibe Master",
    category: "3d",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=ffdfbf,b6e3f4",
  },
  {
    id: "3d-6",
    label: "Luna Spark",
    category: "3d",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Luna&backgroundColor=ffd5dc,c0aede",
  },

  // 📸 Professional Studio Portraits
  {
    id: "portrait-1",
    label: "Studio Pro",
    category: "portraits",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    badge: "Studio",
  },
  {
    id: "portrait-2",
    label: "Tech Founder",
    category: "portraits",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    badge: "Pro",
  },
  {
    id: "portrait-3",
    label: "Creative Designer",
    category: "portraits",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "portrait-4",
    label: "Software Engineer",
    category: "portraits",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "portrait-5",
    label: "Content Creator",
    category: "portraits",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "portrait-6",
    label: "Digital Artist",
    category: "portraits",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
  },

  // ✍️ Notion & Minimalist Hand-Drawn
  {
    id: "notion-1",
    label: "Maya Minimal",
    category: "notion",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=ffd5dc",
    badge: "Notion",
  },
  {
    id: "notion-2",
    label: "Alex Sketch",
    category: "notion",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=c0aede",
  },
  {
    id: "notion-3",
    label: "Jordan Clean",
    category: "notion",
    url: "https://api.dicebear.com/7.x/notionists/svg?seed=Jordan&backgroundColor=b6e3f4",
  },
  {
    id: "notion-4",
    label: "Taylor Peep",
    category: "notion",
    url: "https://api.dicebear.com/7.x/open-peeps/svg?seed=Taylor&backgroundColor=ffdfbf",
  },
  {
    id: "notion-5",
    label: "Micah Creative",
    category: "notion",
    url: "https://api.dicebear.com/7.x/micah/svg?seed=Micah&backgroundColor=d1d4f9",
  },
  {
    id: "notion-6",
    label: "Sloan Chill",
    category: "notion",
    url: "https://api.dicebear.com/7.x/open-peeps/svg?seed=Sloan&backgroundColor=ffd5dc",
  },

  // 🤖 Cyberpunk & Sci-Fi Bots
  {
    id: "cyber-1",
    label: "Bot Quantum",
    category: "cyber",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Quantum&backgroundColor=820ad1",
    badge: "Cyber",
  },
  {
    id: "cyber-2",
    label: "Neon Matrix",
    category: "cyber",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&backgroundColor=2563eb",
  },
  {
    id: "cyber-3",
    label: "Cyborg Zero",
    category: "cyber",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Zero&backgroundColor=10b981",
  },
  {
    id: "cyber-4",
    label: "Pixel Hero",
    category: "cyber",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero&backgroundColor=ff5757",
  },
  {
    id: "cyber-5",
    label: "Pixel Mage",
    category: "cyber",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mage&backgroundColor=f59e0b",
  },
  {
    id: "cyber-6",
    label: "Mecha Volt",
    category: "cyber",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Volt&backgroundColor=ec4899",
  },

  // 🌈 Gradient Art & Shapes
  {
    id: "grad-1",
    label: "Hyperion Violet",
    category: "gradients",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=Hyperion&backgroundColor=820ad1,6366f1",
    badge: "Gradient",
  },
  {
    id: "grad-2",
    label: "Sunset Aurora",
    category: "gradients",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=Aurora&backgroundColor=ff5757,f59e0b",
  },
  {
    id: "grad-3",
    label: "Emerald Mystic",
    category: "gradients",
    url: "https://api.dicebear.com/7.x/identicon/svg?seed=Emerald&backgroundColor=10b981,059669",
  },
  {
    id: "grad-4",
    label: "Oceanic Wave",
    category: "gradients",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=Oceanic&backgroundColor=2563eb,06b6d4",
  },
  {
    id: "grad-5",
    label: "Neon Prism",
    category: "gradients",
    url: "https://api.dicebear.com/7.x/identicon/svg?seed=Prism&backgroundColor=ec4899,8b5cf6",
  },
  {
    id: "grad-6",
    label: "Solar Flare",
    category: "gradients",
    url: "https://api.dicebear.com/7.x/shapes/svg?seed=Solar&backgroundColor=f59e0b,ef4444",
  },
];

// Helper: Resize and square-crop local image using HTML5 Canvas for instant, fast upload
async function processAndCompressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // Crop & center to square
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

// Helper: Convert processed image file to a base64 data URL for storage
async function uploadImageFile(file: File): Promise<string> {
  // 1. Process & compress image to high quality 512x512 JPEG
  const processedBlob = await processAndCompressImage(file);

  // 2. Convert to base64 data URL (works without any external service)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Failed to convert image to data URL."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(processedBlob);
  });
}

export function ChangeAvatarModal({
  isOpen,
  currentAvatar,
  displayName = "Creator",
  onClose,
  onSuccess,
}: Props) {
  const { refresh } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"upload" | "library">("upload");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatar || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync on open
  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentAvatar || "");
      setSelectedFile(null);
      setImageError(false);
      setUploadStatusText("");
    }
  }, [isOpen, currentAvatar]);

  // ── Hooks must be called before any early return ──────────────────────────
  const debouncedSearchQuery = useDebounce(searchQuery, 150);

  const filteredLibrary = useMemo(() => {
    return AVATAR_LIBRARY.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        !debouncedSearchQuery ||
        item.label.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, debouncedSearchQuery]);

  if (!isOpen) return null;

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toastError("Please select a valid image file (PNG, JPG, JPEG, WEBP, or GIF)");
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toastError("Image size must be less than 20MB");
      return;
    }

    try {
      // Fast client-side canvas downscaling (<50ms) to reduce upload payload by ~95%
      const compressed = await compressImage(file, { maxDimension: 512, quality: 0.82 });
      setSelectedFile(compressed);
      const previewUrl = URL.createObjectURL(compressed);
      setSelectedUrl(previewUrl);
      setImageError(false);
    } catch {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setSelectedUrl(previewUrl);
      setImageError(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveAvatar = async () => {
    setSaving(true);
    try {
      await updateProfile({
        avatar: null,
        profilePicture: null,
      });
      await refresh();
      success("Profile picture removed");
      onSuccess?.(null);
      onClose();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalUrl = selectedUrl.trim() || null;

      // If a local device file is selected, upload it first to get the hosted URL
      if (selectedFile) {
        setUploadStatusText("Uploading image from your device...");
        finalUrl = await uploadImageFile(selectedFile);
      }

      setUploadStatusText("Updating your creator profile...");
      await updateProfile({
        avatar: finalUrl,
        profilePicture: finalUrl,
      });
      await refresh();
      success("Profile picture updated successfully!");
      onSuccess?.(finalUrl);
      onClose();
    } catch (err) {
      console.error("Save profile picture error:", err);
      toastError(err instanceof Error ? err.message : "Failed to update profile picture");
    } finally {
      setSaving(false);
      setUploadStatusText("");
    }
  };

  const isChanged = selectedFile !== null || selectedUrl !== (currentAvatar || "");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#180F26] rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10 bg-white/50 dark:bg-white/2 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nu-purple to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-nu-charcoal dark:text-white">
                Change Profile Picture
              </h3>
              <p className="text-xs text-nu-muted dark:text-gray-400">
                Upload a photo from your device or pick a curated avatar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-nu-muted hover:text-nu-charcoal dark:hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Top Row: Spotlight Preview & Tab Switcher */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-r from-purple-50/70 via-indigo-50/30 to-purple-50/50 dark:from-purple-950/25 dark:via-indigo-950/15 dark:to-transparent rounded-3xl border border-purple-100/80 dark:border-purple-900/30 shadow-xs">
            {/* Avatar Circle */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-white dark:border-[#180F26] shadow-nu-elevated bg-nu-purple-soft flex items-center justify-center overflow-hidden transition-all group-hover:scale-102">
                {selectedUrl && !imageError ? (
                  <img
                    src={selectedUrl}
                    alt={displayName}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-nu-purple font-extrabold text-3xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-gradient-to-r from-nu-purple to-indigo-600 text-white shadow-md border-2 border-white dark:border-[#180F26]">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Preview info + Tab switcher */}
            <div className="flex-1 flex flex-col justify-center gap-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-nu-purple bg-nu-purple-soft dark:bg-nu-purple/20 px-2.5 py-0.5 rounded-full">
                  Profile Picture Preview
                </span>
                <h4 className="text-base font-extrabold text-nu-charcoal dark:text-white mt-1">
                  {displayName}
                </h4>
                <p className="text-xs text-nu-muted dark:text-gray-400">
                  {selectedFile
                    ? `Selected local file: ${selectedFile.name}`
                    : selectedUrl
                    ? "Ready to be saved as your profile picture"
                    : "Using default letter avatar"}
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 bg-white/80 dark:bg-[#211535] p-1 rounded-2xl border border-gray-200/70 dark:border-white/10 shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "upload"
                      ? "bg-nu-purple text-white shadow-xs"
                      : "text-nu-muted dark:text-gray-300 hover:text-nu-charcoal dark:hover:text-white"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("library")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "library"
                      ? "bg-nu-purple text-white shadow-xs"
                      : "text-nu-muted dark:text-gray-300 hover:text-nu-charcoal dark:hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Avatar Library</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Tab 1: Upload from Device ──────────────────────────────── */}
          {activeTab === "upload" && (
            <div className="flex flex-col gap-4">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? "border-nu-purple bg-nu-purple-soft/50 dark:bg-nu-purple/20 scale-[1.01]"
                    : "border-gray-200 dark:border-white/15 hover:border-nu-purple/50 bg-gray-50/60 dark:bg-white/2 hover:bg-gray-50 dark:hover:bg-white/4"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-nu-purple-soft dark:bg-nu-purple/20 flex items-center justify-center text-nu-purple mb-3 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-nu-charcoal dark:text-white text-center">
                  Click to browse or drag & drop photo here
                </p>
                <p className="text-xs text-nu-muted dark:text-gray-400 mt-1 text-center">
                  Supports PNG, JPG, WEBP, or GIF (max 20MB)
                </p>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-4 flex items-center gap-2 bg-nu-purple hover:bg-nu-purple-hover text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Choose Image File</span>
                </button>
              </div>

              {/* Selected File Status Card */}
              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to save
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setSelectedUrl(currentAvatar || "");
                    }}
                    className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-all text-xs font-semibold"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Tab 2: Curated Avatar Library ─────────────────────────── */}
          {activeTab === "library" && (
            <div className="flex flex-col gap-4">
              {/* Category Pills & Search */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "all", label: "All Styles" },
                    { id: "3d", label: "✨ 3D Characters" },
                    { id: "portraits", label: "📸 Portraits" },
                    { id: "notion", label: "✍️ Notion & Sketch" },
                    { id: "cyber", label: "🤖 Cyber & Gaming" },
                    { id: "gradients", label: "🌈 Gradients" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id as CategoryType)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                        activeCategory === cat.id
                          ? "bg-nu-purple text-white border-nu-purple shadow-xs"
                          : "bg-white dark:bg-[#180F26] text-nu-muted dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-nu-purple/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[160px] sm:w-48">
                  <Search className="w-3.5 h-3.5 text-nu-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search styles..."
                    className="w-full bg-white dark:bg-[#211535] border border-gray-200 dark:border-white/10 rounded-full pl-8 pr-3 py-1.5 text-xs text-nu-charcoal dark:text-white placeholder-nu-muted/60 focus:outline-none focus:ring-2 focus:ring-nu-purple/30"
                  />
                </div>
              </div>

              {/* Grid of Avatars */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5 max-h-72 overflow-y-auto pr-1">
                {filteredLibrary.map((item) => {
                  const isSelected = !selectedFile && selectedUrl === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedUrl(item.url);
                        setImageError(false);
                      }}
                      className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-nu-purple bg-nu-purple-soft/50 dark:bg-nu-purple/20 ring-2 ring-nu-purple shadow-sm scale-105"
                          : "border-gray-200/80 dark:border-white/10 hover:border-nu-purple/40 bg-gray-50/50 dark:bg-white/5 hover:scale-102"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white dark:bg-black/30 flex items-center justify-center shadow-xs">
                        <img
                          src={item.url}
                          alt={item.label}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-nu-charcoal dark:text-gray-200 truncate max-w-full">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="absolute top-1 left-1 text-[8px] font-extrabold uppercase bg-nu-purple/90 text-white px-1.5 py-0.2 rounded-md shadow-xs">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-nu-purple text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/2 gap-3 flex-wrap">
          {currentAvatar ? (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 p-2 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {uploadStatusText && (
              <span className="text-xs text-nu-muted dark:text-gray-400 flex items-center gap-1.5 mr-2 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-nu-purple" />
                {uploadStatusText}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-full border border-gray-200 dark:border-white/10 text-xs font-semibold text-nu-muted hover:text-nu-charcoal dark:hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isChanged}
              className="flex items-center gap-2 bg-nu-purple hover:bg-nu-purple-hover text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Picture</span>
                </>
              )}
            </button>
          </div>
        </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
