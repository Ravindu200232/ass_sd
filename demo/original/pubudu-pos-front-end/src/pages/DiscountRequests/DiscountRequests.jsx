// src/pages/DiscountRequests/DiscountRequests.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  Settings,
  X,
  CheckCircle,
  Smartphone,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Phone,
  Tablet,
  Monitor,
  Menu,
  Download,
  Share2,
  MoreVertical,
  Clock,
  Check,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  FileText,
  MessageSquare,
} from "lucide-react";

// Import components
import { LoadingSpinner } from "../../components/DiscountRequests/Loading";
import { PageHeader } from "../../components/DiscountRequests/PageHeader";
import { AdminHeader } from "../../components/DiscountRequests/AdminHeader";
import {
  AdminEmptyState,
  UserEmptyState,
} from "../../components/DiscountRequests/EmptyStates";
import { AdminTableRow } from "../../components/DiscountRequests/AdminTableRow";
import { UserTableRow } from "../../components/DiscountRequests/UserTableRow";

// Mobile-specific components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Service worker registration
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }
  return null;
};

// Check if mobile device
const checkIsMobile = () => {
  if (typeof window === "undefined") return false;
  
  // Check for touch device and screen width
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  
  // User agent check as fallback
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  return (isTouchDevice && isSmallScreen) || isMobileUA;
};

// Check device type
const checkDeviceType = () => {
  if (typeof window === "undefined") return "desktop";
  
  const width = window.innerWidth;
  if (width < 640) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
};

// Mobile Admin Table Row Component
const MobileAdminTableRow = ({ request, note, onNoteChange, onApprove, onReject }) => {
  const [showNote, setShowNote] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <Check className="h-3 w-3 mr-1" />;
      case "rejected": return <XCircle className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono text-xs">
                #{request.id}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Invoice: {request.invoice_number || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              ${parseFloat(request.final_price || request.original_price).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              -${parseFloat(request.discount_amount || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Product info */}
        <div>
          <h4 className="font-medium text-gray-900 truncate">
            {request.product_name || "Unknown Product"}
          </h4>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <User className="h-3 w-3 mr-1" />
            <span>{request.employee_name || request.requested_by}</span>
          </div>
        </div>

        {/* Price info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Original</p>
            <p className="font-medium">${parseFloat(request.original_price).toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <p className="text-xs text-blue-600">Discount</p>
            <p className="font-medium text-blue-600">
              {request.discount_percentage}% (${parseFloat(request.discount_amount || 0).toFixed(2)})
            </p>
          </div>
        </div>

        {/* Reason */}
        {request.reason && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Reason</p>
            <p className="text-sm bg-gray-50 p-2 rounded">{request.reason}</p>
          </div>
        )}

        {/* Note section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Admin Note</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setShowNote(!showNote)}
            >
              {showNote ? "Hide" : "Add Note"}
            </Button>
          </div>
          {showNote && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={note || ""}
                onChange={(e) => onNoteChange(request.id, e.target.value)}
                className="text-sm min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => onApprove(request.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onReject(request.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(request.created_at).toLocaleDateString()}
            </div>
            {!showNote && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => onApprove(request.id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => onReject(request.id)}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile User Table Row Component
const MobileUserTableRow = ({ request }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <Check className="h-3 w-3 mr-1" />;
      case "rejected": return <XCircle className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono text-xs">
                #{request.id}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                {request.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Invoice: {request.invoice_number || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              ${parseFloat(request.final_price || request.original_price).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 line-through">
              ${parseFloat(request.original_price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Product info */}
        <div>
          <h4 className="font-medium text-gray-900">
            {request.product_name || "Unknown Product"}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {request.reason || "No reason provided"}
          </p>
        </div>

        {/* Price breakdown */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Original Price</p>
              <p className="font-medium">${parseFloat(request.original_price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Discount</p>
              <p className="font-medium text-green-600">
                {request.discount_percentage}%
              </p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <p className="text-sm font-medium">Final Price</p>
                <p className="text-lg font-bold text-blue-600">
                  ${parseFloat(request.final_price).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin note */}
        {request.admin_note && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start">
              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-700 font-medium mb-1">Admin Note</p>
                <p className="text-sm text-blue-800">{request.admin_note}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(request.updated_at || request.created_at).toLocaleDateString()}
            </div>
            <div className="text-right">
              <p className="text-xs">
                Updated: {new Date(request.updated_at || request.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DiscountRequests() {
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [refreshing, setRefreshing] = useState(false);
  const [noteMap, setNoteMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Notification states
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [serviceWorkerSupported, setServiceWorkerSupported] = useState(false);
  const [deviceType, setDeviceType] = useState("desktop");
  const [isMobile, setIsMobile] = useState(false);

  const pollingRef = useRef(null);
  const lastRequestIdsRef = useRef(new Set());
  const notificationTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Detect device type and screen size
  useEffect(() => {
    const updateDeviceInfo = () => {
      const mobile = checkIsMobile();
      const device = checkDeviceType();
      setIsMobile(mobile);
      setDeviceType(device);
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);

    setServiceWorkerSupported(
      "serviceWorker" in navigator && "PushManager" in window
    );

    if (isAdmin) {
      // Check notification permission
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      } else if ("permissions" in navigator) {
        navigator.permissions
          .query({ name: "notifications" })
          .then((permissionStatus) => {
            setNotificationPermission(permissionStatus.state);
          });
      }

      // Only show prompt if permission is default and we haven't shown it recently
      const lastPrompt = localStorage.getItem("notificationPromptDismissed");
      const shouldShowPrompt =
        notificationPermission === "default" &&
        (!lastPrompt ||
          Date.now() - parseInt(lastPrompt) > 7 * 24 * 60 * 60 * 1000); // 7 days

      if (shouldShowPrompt) {
        setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 2000);
      }

      // Load notification preference
      const savedPreference = localStorage.getItem("notificationEnabled");
      setNotificationEnabled(
        savedPreference === "true" &&
          (notificationPermission === "granted" ||
            (serviceWorkerSupported && isMobile))
      );

      // Register service worker for mobile
      if (serviceWorkerSupported && isMobile) {
        registerServiceWorker();
      }
    }

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
    };
  }, [isAdmin, notificationPermission, serviceWorkerSupported, isMobile]);

  const setNote = useCallback((id, value) => {
    setNoteMap((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Request notification permission with mobile support
  const requestNotificationPermission = useCallback(async () => {
    if (isMobile && serviceWorkerSupported) {
      try {
        const registration = await registerServiceWorker();
        if (!registration) {
          toast.error("Failed to set up notifications on mobile");
          return;
        }

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
        });

        await api.post("/notifications/subscribe", {
          subscription: JSON.stringify(subscription),
          user_id: user?.id,
        });

        setNotificationPermission("granted");
        setNotificationEnabled(true);
        localStorage.setItem("notificationEnabled", "true");
        toast.success("Mobile notifications enabled!");
      } catch (error) {
        console.error("Mobile notification setup failed:", error);
        toast.error("Failed to enable mobile notifications");
      }
    } else if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        localStorage.setItem(
          "notificationPromptDismissed",
          Date.now().toString()
        );
        setShowNotificationPrompt(false);

        if (permission === "granted") {
          toast.success(
            "Notifications enabled! You'll be alerted for new requests."
          );
          setNotificationEnabled(true);
          localStorage.setItem("notificationEnabled", "true");
          showTestNotification();
        } else if (permission === "denied") {
          toast.info(
            "Notifications disabled. You can enable them in browser settings."
          );
          setNotificationEnabled(false);
          localStorage.setItem("notificationEnabled", "false");
        }
      });
    } else {
      toast.error("Notifications are not supported in this browser");
    }
  }, [isMobile, serviceWorkerSupported, user?.id]);

  // Show a test notification with mobile support
  const showTestNotification = async () => {
    if (isMobile && serviceWorkerSupported) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification("Discount Requests", {
        body: "✓ Notifications are now enabled! You'll be alerted for new discount requests.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        requireInteraction: false,
        tag: "test-notification",
      });
    } else if (Notification.permission === "granted") {
      const notification = new Notification("Discount Requests", {
        body: "✓ Notifications are now enabled! You'll be alerted for new discount requests.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        tag: "test-notification",
      });

      setTimeout(() => notification.close(), 5000);
    }
  };

  // Toggle notifications with mobile support
  const toggleNotifications = useCallback(async () => {
    if (isMobile && serviceWorkerSupported) {
      if (notificationEnabled) {
        setNotificationEnabled(false);
        localStorage.setItem("notificationEnabled", "false");

        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            await api.post("/notifications/unsubscribe", {
              subscription: JSON.stringify(subscription),
            });
          }
        } catch (error) {
          console.error("Failed to unsubscribe:", error);
        }

        toast.info("Mobile notifications disabled");
      } else {
        await requestNotificationPermission();
      }
    } else if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const newState = !notificationEnabled;
        setNotificationEnabled(newState);
        localStorage.setItem("notificationEnabled", newState.toString());

        if (newState) {
          toast.success("Notifications enabled");
          showTestNotification();
        } else {
          toast.info("Notifications disabled");
        }
      } else if (Notification.permission === "default") {
        requestNotificationPermission();
      } else {
        toast.error("Notifications are blocked. Please enable them in your browser settings.", {
          action: {
            label: "Guide",
            onClick: () => {
              if (isMobile) {
                window.open(
                  "https://support.google.com/chrome/answer/3220216?co=GENIE.Platform%3DAndroid",
                  "_blank"
                );
              } else {
                window.open(
                  "https://support.google.com/chrome/answer/3220216",
                  "_blank"
                );
              }
            },
          },
        });
      }
    } else {
      toast.error("Notifications are not supported in this browser");
    }
  }, [
    notificationEnabled,
    isMobile,
    serviceWorkerSupported,
    requestNotificationPermission,
  ]);

  // Fetch requests
  const fetchDiscountRequests = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const endpoint = isAdmin
          ? "/discount-requests?status=pending"
          : "/discount-requests";
        const res = await api.get(endpoint);
        const newRequests = res.data.data || [];

        // Check for new requests (admin only)
        if (isAdmin && newRequests.length > 0) {
          const currentIds = new Set(newRequests.map((r) => r.id));
          const newRequestIds = Array.from(currentIds).filter(
            (id) => !lastRequestIdsRef.current.has(id)
          );

          if (newRequestIds.length > 0 && lastRequestIdsRef.current.size > 0) {
            const newRequestsList = newRequests.filter((r) =>
              newRequestIds.includes(r.id)
            );

            // Show mobile-friendly toast
            toast.success(
              `📨 ${newRequestsList.length} new request${
                newRequestsList.length > 1 ? "s" : ""
              }`,
              {
                duration: 4000,
                icon: <Bell className="h-5 w-5 text-blue-500" />,
                action: isMobile
                  ? undefined // Don't show action on mobile to avoid accidental clicks
                  : {
                      label: "View",
                      onClick: () => {
                        document
                          .getElementById("requests-table")
                          ?.scrollIntoView({ behavior: "smooth" });
                      },
                    },
              }
            );
          }

          lastRequestIdsRef.current = currentIds;
        }

        setRequests(newRequests);
      } catch (err) {
        console.error(err);
        if (!silent) {
          toast.error("Failed to fetch requests");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAdmin, isMobile]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (!refreshing) {
      fetchDiscountRequests(true);
    }
  }, [fetchDiscountRequests, refreshing]);

  // Handle approve
  const handleApprove = useCallback(
    async (id) => {
      const admin_note = (noteMap[id] || "").trim();
      try {
        await api.post(`/discount-requests/${id}/approve`, { admin_note });
        toast.success("✅ Request approved");
        setNote(id, "");
        lastRequestIdsRef.current.delete(id);

        setRequests((prevRequests) =>
          prevRequests.filter((request) => request.id !== id)
        );
      } catch (err) {
        console.error(err);
        const msg = err?.response?.data?.message || "Approve failed";
        toast.error(msg);
        fetchDiscountRequests(true);
      }
    },
    [noteMap, setNote, fetchDiscountRequests]
  );

  // Handle reject
  const handleReject = useCallback(
    async (id) => {
      const admin_note = (noteMap[id] || "").trim();
      try {
        await api.post(`/discount-requests/${id}/reject`, { admin_note });
        toast.success("❌ Request rejected");
        setNote(id, "");
        lastRequestIdsRef.current.delete(id);

        setRequests((prevRequests) =>
          prevRequests.filter((request) => request.id !== id)
        );
      } catch (err) {
        console.error(err);
        const msg = err?.response?.data?.message || "Reject failed";
        toast.error(msg);
        fetchDiscountRequests(true);
      }
    },
    [noteMap, setNote, fetchDiscountRequests]
  );

  // Filter and sort requests
  const filteredRequests = useCallback(() => {
    let filtered = requests;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.id.toString().includes(searchTerm) ||
          request.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter (for admin)
    if (isAdmin && filterStatus !== "all") {
      filtered = filtered.filter((request) => request.status === filterStatus);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "price_high":
          return parseFloat(b.original_price) - parseFloat(a.original_price);
        case "price_low":
          return parseFloat(a.original_price) - parseFloat(b.original_price);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  }, [requests, searchTerm, filterStatus, sortBy, isAdmin]);

  // Polling setup with mobile optimization
  useEffect(() => {
    fetchDiscountRequests();

    if (isAdmin) {
      // Adjust polling based on device
      const pollInterval = isMobile ? 60000 : 30000; // 60 seconds for mobile, 30 for desktop
      
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      pollingRef.current = setInterval(() => {
        fetchDiscountRequests(true);
      }, pollInterval);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
      };
    }
  }, [isAdmin, fetchDiscountRequests, isMobile]);

  if (loading) return <LoadingSpinner isMobile={isMobile} />;

  const employeeRequests = requests.filter(
    (r) => r.requested_by === (user?.user_code || "")
  );
  const visibleRequests = isAdmin
    ? filteredRequests()
    : employeeRequests.filter((r) => r.status === selectedStatus);

  // Device icon
  const getDeviceIcon = () => {
    switch (deviceType) {
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CSS Variables for mobile optimization */}
      <style>
        {`
          @media (max-width: 768px) {
            body {
              -webkit-tap-highlight-color: transparent;
            }
            
            button, [role="button"] {
              min-height: 44px;
              min-width: 44px;
            }
            
            input, textarea {
              font-size: 16px; /* Prevents zoom on iOS */
            }
          }
        `}
      </style>

      {/* Main Content */}
      <div className="p-4 max-w-7xl mx-auto">
        {/* Notification Permission Prompt */}
        {showNotificationPrompt && isAdmin && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    {isMobile ? (
                      <Smartphone className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <BellRing className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">
                        {isMobile ? "Mobile Alerts" : "Get instant alerts"}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {isMobile
                          ? "Enable push notifications to get alerts for new discount requests even when the app is closed."
                          : "Enable browser notifications to get alerts for new discount requests even when this tab is closed."}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-3">
                        <Button
                          size={isMobile ? "default" : "sm"}
                          onClick={requestNotificationPermission}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isMobile ? (
                            <Smartphone className="h-4 w-4 mr-2" />
                          ) : (
                            <Bell className="h-4 w-4 mr-2" />
                          )}
                          Enable Notifications
                        </Button>
                        <Button
                          size={isMobile ? "default" : "sm"}
                          variant="outline"
                          onClick={() => {
                            setShowNotificationPrompt(false);
                            localStorage.setItem(
                              "notificationPromptDismissed",
                              Date.now().toString()
                            );
                          }}
                        >
                          Maybe Later
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                    onClick={() => {
                      setShowNotificationPrompt(false);
                      localStorage.setItem(
                        "notificationPromptDismissed",
                        Date.now().toString()
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header with responsive controls */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Discount Requests
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">
                {isAdmin
                  ? "Manage and approve discount requests"
                  : "Track your discount request status"}
              </p>
            </div>

            {/* Mobile menu button */}
            {isMobile && isAdmin && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <Input
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        ref={searchInputRef}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Filter by Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sort by</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Newest first" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest first</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                          <SelectItem value="price_high">Price (high to low)</SelectItem>
                          <SelectItem value="price_low">Price (low to high)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Notifications</Label>
                      <Switch
                        id="notifications"
                        checked={notificationEnabled}
                        onCheckedChange={toggleNotifications}
                      />
                    </div>
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Now
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Search and filter bar */}
          {isAdmin && (
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              {/* Search input - full width on mobile */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by ID, product, or employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                  ref={searchInputRef}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Filter and sort controls - hidden on mobile (in menu) */}
              {!isMobile && (
                <>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="price_high">Price (high to low)</SelectItem>
                      <SelectItem value="price_low">Price (low to high)</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Action buttons */}
              <div className="flex space-x-2">
                {!isMobile && isAdmin && (
                  <Button
                    variant={notificationEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={toggleNotifications}
                    className="gap-2"
                  >
                    {notificationEnabled ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Alerts On
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        Enable Alerts
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "default"}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {!isMobile && "Refresh"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats cards (mobile optimized) */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold">{requests.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {requests.filter(r => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {requests.filter(r => r.status === "approved").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Device</p>
                    <div className="flex items-center space-x-2">
                      {getDeviceIcon()}
                      <span className="text-sm font-medium capitalize">
                        {deviceType}
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {notificationEnabled ? (
                      <BellRing className="h-5 w-5 text-green-600" />
                    ) : (
                      <Bell className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        {isAdmin ? (
          <Card id="requests-table" className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">
                    All Requests ({filteredRequests().length})
                  </h2>
                  {searchTerm && (
                    <p className="text-sm text-gray-600 mt-1">
                      Searching for: "{searchTerm}"
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isMobile && isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      {getDeviceIcon()}
                      <span className="ml-1 capitalize">{deviceType}</span>
                    </Badge>
                  )}
                  {notificationEnabled && (
                    <Badge variant="outline" className="text-xs bg-green-50">
                      <Bell className="h-3 w-3 mr-1" />
                      Alerts On
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredRequests().length > 0 ? (
                <>
                  {/* Desktop Table */}
                  {!isMobile && (
                    <div className="relative">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">ID</TableHead>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Employee</TableHead>
                              <TableHead>Original Price</TableHead>
                              <TableHead>Discount</TableHead>
                              <TableHead>Final Price</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Requested</TableHead>
                              <TableHead className="w-[180px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRequests().map((request) => (
                              <AdminTableRow
                                key={request.id}
                                request={request}
                                note={noteMap[request.id]}
                                onNoteChange={setNote}
                                onApprove={handleApprove}
                                onReject={handleReject}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Mobile Card View */}
                  {isMobile && (
                    <div className="divide-y divide-gray-100">
                      {filteredRequests().map((request) => (
                        <MobileAdminTableRow
                          key={request.id}
                          request={request}
                          note={noteMap[request.id]}
                          onNoteChange={setNote}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      ))}
                    </div>
                  )}

                  {/* Refresh indicator */}
                  {refreshing && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-lg shadow-lg border">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                        <span className="text-gray-700 font-medium">
                          Checking for new requests...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No requests found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? "No requests match your search criteria"
                      : "No discount requests at the moment"}
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              )}

              {/* Polling status */}
              {isAdmin && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          pollingRef.current ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <span>
                        {pollingRef.current
                          ? `Auto-refresh: ${
                              isMobile ? "60s" : "30s"
                            }`
                          : "Auto-refresh paused"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {filteredRequests().length} requests shown
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            {/* Mobile-optimized tabs */}
            <div className="sticky top-0 bg-white z-10 pt-2 pb-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="pending" className="relative py-3">
                  Pending
                  {employeeRequests.filter((r) => r.status === "pending")
                    .length > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                    >
                      {employeeRequests.filter((r) => r.status === "pending")
                        .length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="py-3">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="py-3">
                  Rejected
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedStatus} className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">My Requests</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {selectedStatus === "pending" && "Awaiting approval"}
                        {selectedStatus === "approved" && "Approved requests"}
                        {selectedStatus === "rejected" && "Rejected requests"}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {
                        employeeRequests.filter(
                          (r) => r.status === selectedStatus
                        ).length
                      }{" "}
                      requests
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {visibleRequests.length > 0 ? (
                    <>
                      {/* Desktop Table */}
                      {!isMobile && (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Original Price</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Final Price</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Admin Note</TableHead>
                                <TableHead>Updated</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleRequests.map((request) => (
                                <UserTableRow key={request.id} request={request} />
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Mobile Card View */}
                      {isMobile && (
                        <div className="divide-y divide-gray-100">
                          {visibleRequests.map((request) => (
                            <MobileUserTableRow
                              key={request.id}
                              request={request}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        {selectedStatus === "pending" ? (
                          <Clock className="h-8 w-8 text-gray-400" />
                        ) : selectedStatus === "approved" ? (
                          <Check className="h-8 w-8 text-gray-400" />
                        ) : (
                          <XCircle className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {selectedStatus} requests
                      </h3>
                      <p className="text-gray-600">
                        {selectedStatus === "pending"
                          ? "You don't have any pending discount requests"
                          : selectedStatus === "approved"
                          ? "No approved discount requests yet"
                          : "No rejected discount requests"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <div className="fixed bottom-6 right-6 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-lg"
                >
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={toggleNotifications}>
                      <Bell className="h-4 w-4 mr-2" />
                      {notificationEnabled ? "Disable Alerts" : "Enable Alerts"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Now
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => searchInputRef.current?.focus()}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setSearchTerm("")}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Search
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Bottom padding for mobile FAB */}
        {isMobile && <div className="h-20"></div>}
      </div>
    </div>
  );
}