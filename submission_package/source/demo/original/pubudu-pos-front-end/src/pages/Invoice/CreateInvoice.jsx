import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

// Import icons
import {
  ShoppingCart,
  Printer,
  Receipt,
  User,
  CreditCard,
  Save,
  Search,
  Plus,
  Minus,
  Trash2,
  Wrench,
  Package,
  Download,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Settings,
  Hash,
  Tag,
  Box,
  Layers,
  Grid,
  Ruler,
  Building,
  Check,
  Info,
  X,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import components
import LoadingSpinner from "../../components/CreateInvoice/LoadingSpinner";
import NewCustomerDialog from "../../components/CreateInvoice/NewCustomerDialog";
import NewServiceDialog from "../../components/CreateInvoice/NewServiceDialog";
import DraftsDialog from "../../components/CreateInvoice/DraftsDialog";
import ReceiptSettingsDialog from "../../components/CreateInvoice/ReceiptSettingsDialog";
import CustomerDepartmentDialog from "../../components/CreateInvoice/CustomerDepartmentDialog";
import PaymentDetailsDialog from "../../components/CreateInvoice/PaymentDetailsDialog";
import ServicesManagerDialog from "../../components/CreateInvoice/ServicesManagerDialog";

// Constants
const DRAFT_KEY = "invoice_drafts_v2";
const THERMAL_SHOP_INFO = { name: "PUBUDU AUTO MACHINERIES" };

export default function CreateInvoice() {
  // State management
  const [departments, setDepartments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productsRaw, setProductsRaw] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addItemTab, setAddItemTab] = useState("products"); // "products" | "services"


  // Dialog states
  const [activeDialog, setActiveDialog] = useState(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [isServicesManagerOpen, setIsServicesManagerOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  // Search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [unifiedSearchTerm, setUnifiedSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Invoice states
  const [departmentId, setDepartmentId] = useState("");
  const [customerType, setCustomerType] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("cash");
  const [payAmount, setPayAmount] = useState(0);
  const [note, setNote] = useState("");
  const [cart, setCart] = useState([]);

  // Service states
  const [newService, setNewService] = useState({
    name: "",
    price: 0,
    description: "",
    category: "custom",
    type: "service",
  });

  // Draft states
  const [drafts, setDrafts] = useState([]);

  // Customer dialog
  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    address: "",
    phone_no_01: "",
    phone_no_02: "",
    nic_no: "",
    department_id: "",
    credit_limit: 0,
    credit_enabled: false,
    credit_balance: 0,
  });

  // Polling states
  const [draftInvoiceNo, setDraftInvoiceNo] = useState(null);
  const [requestStatusMap, setRequestStatusMap] = useState({});
  const [pollingActive, setPollingActive] = useState(false);
  const pollingRef = useRef(null);
  const processedRequestsRef = useRef(new Set());

  // Thermal receipt states - REMOVED orderNo state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [userCode, setUserCode] = useState("CH01");
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  // User states
  const [currentUser, setCurrentUser] = useState({
    id: 0,
    user_code: "CH01",
    full_name: "System User",
    username: "system",
    role: "guest",
    department_id: null,
  });
  const [isDepartmentLocked, setIsDepartmentLocked] = useState(false);

  // Discount Request Modal State
  const [discountRequestModal, setDiscountRequestModal] = useState({
    isOpen: false,
    itemId: "",
    productCode: "",
    productName: "",
    currentPrice: 0,
    requestedDiscount: 0,
    reason: "",
    itemType: "product",
  });

  // Memoized calculations
  const totalAmount = useMemo(
    () =>
      cart.reduce(
        (s, i) =>
          s + Number(i.selling_price || i.price || 0) * Number(i.qty || 0),
        0
      ),
    [cart]
  );

  const totalDiscount = useMemo(
    () =>
      cart.reduce((s, i) => {
        const discount =
          i.type === "service"
            ? Number(i.applied_discount || 0)
            : Number(i.applied_discount || 0);
        return s + discount * Number(i.qty || 0);
      }, 0),
    [cart]
  );

  const netTotal = useMemo(
    () => totalAmount - totalDiscount,
    [totalAmount, totalDiscount]
  );

  // Card surcharge: 3% added when payment method is card
  const cardSurcharge = useMemo(
    () => (paymentStatus === "card" ? netTotal * 3 / 100 : 0),
    [paymentStatus, netTotal]
  );

  const effectiveNetTotal = useMemo(
    () => netTotal + cardSurcharge,
    [netTotal, cardSurcharge]
  );

  const payableTotal = useMemo(
    () => (paymentStatus === "card" ? effectiveNetTotal : netTotal),
    [paymentStatus, effectiveNetTotal, netTotal]
  );

  const selectedCustomerDetails = useMemo(() => {
    return customers.find((c) => c.customer_code === selectedCustomer) || null;
  }, [customers, selectedCustomer]);

  const availableCredit = useMemo(() => {
    if (!selectedCustomerDetails || !selectedCustomerDetails.credit_enabled)
      return 0;
    return Math.max(
      0,
      selectedCustomerDetails.credit_limit -
        selectedCustomerDetails.credit_balance
    );
  }, [selectedCustomerDetails]);

  const maxCreditCanUse = useMemo(() => {
    if (customerType !== "save" || !selectedCustomer) return 0;
    const customer = customers.find(
      (c) => c.customer_code === selectedCustomer
    );
    if (!customer || !customer.credit_enabled) return 0;
    return Math.min(payableTotal, availableCredit);
  }, [customerType, selectedCustomer, customers, payableTotal, availableCredit]);

  const canUseCredit = useMemo(() => {
    if (customerType !== "save" || !selectedCustomer) return false;
    const customer = customers.find(
      (c) => c.customer_code === selectedCustomer
    );
    return customer && customer.credit_enabled && availableCredit > 0;
  }, [customerType, selectedCustomer, customers, availableCredit]);

  const creditAllocated = useMemo(() => {
    if (paymentStatus === "credit" && canUseCredit) {
      return Math.min(maxCreditCanUse, payableTotal);
    }
    return 0;
  }, [paymentStatus, canUseCredit, maxCreditCanUse, payableTotal]);

  const cashPaymentAmount = useMemo(() => {
    if (paymentStatus === "credit") {
      return Math.max(0, payableTotal - creditAllocated);
    } else {
      return Math.min(payableTotal, Number(payAmount || 0));
    }
  }, [paymentStatus, payableTotal, creditAllocated, payAmount]);

  const balance = useMemo(() => {
    if (paymentStatus === "credit") {
      return Math.max(0, payableTotal - creditAllocated - cashPaymentAmount);
    } else {
      const actualCashPaid = Number(payAmount || 0);
      if (actualCashPaid >= payableTotal) {
        return actualCashPaid - payableTotal;
      } else {
        return payableTotal - actualCashPaid;
      }
    }
  }, [paymentStatus, netTotal, payableTotal, creditAllocated, cashPaymentAmount, payAmount]);

  const isBalanceChange = useMemo(() => {
    if (paymentStatus === "credit") return false;
    const actualCashPaid = Number(payAmount || 0);
    return actualCashPaid >= payableTotal;
  }, [paymentStatus, payAmount, payableTotal]);

  const invoiceType = useMemo(() => {
    const hasProducts = cart.some((item) => item.type === "product");
    const hasServices = cart.some((item) => item.type === "service");
    if (hasProducts && hasServices) return "tire and other";
    if (hasServices) return "other";
    return "tire";
  }, [cart]);

  const serviceDescription = useMemo(() => {
    const serviceItems = cart.filter((item) => item.type === "service");
    if (serviceItems.length === 0) return null;
    return serviceItems.map((item) => item.product_name).join(", ");
  }, [cart]);

  // Filtered products and services
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) {
      return [];
    }

    const term = productSearchTerm.toLowerCase();
    
    let filtered = productsRaw.filter(
      (p) =>
        p.product_name?.toLowerCase().includes(term) ||
        p.product_code?.toLowerCase().includes(term) ||
        p.brand_name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.group?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.size?.toLowerCase().includes(term) ||
        p.pattern?.toLowerCase().includes(term) ||
        p.full_description?.toLowerCase().includes(term)
    );

    // For employees, products are already filtered by department in fetchProducts
    // But we add an additional check here for safety
    if (currentUser.role === "employee" && currentUser.department_id) {
      filtered = filtered.filter(p => 
        String(p.department_id) === String(currentUser.department_id)
      );
    }

    return filtered.slice(0, 15);
  }, [productsRaw, productSearchTerm, currentUser.role, currentUser.department_id]);

  const filteredServices = useMemo(() => {
    if (!serviceSearchTerm.trim()) {
      return [];
    }

    const term = serviceSearchTerm.toLowerCase();
    return services
      .filter(
        (service) =>
          service.name?.toLowerCase().includes(term) ||
          service.description?.toLowerCase().includes(term) ||
          service.category?.toLowerCase().includes(term)
      )
      .slice(0, 15);
  }, [services, serviceSearchTerm]);

  // Unified search: combines products + services in one list
  const filteredUnified = useMemo(() => {
    const term = unifiedSearchTerm.trim().toLowerCase();
    if (!term) return [];

    let products = productsRaw.filter(
      (p) =>
        p.product_name?.toLowerCase().includes(term) ||
        p.product_code?.toLowerCase().includes(term) ||
        p.brand_name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.size?.toLowerCase().includes(term) ||
        p.pattern?.toLowerCase().includes(term)
    );
    if (currentUser.role === "employee" && currentUser.department_id) {
      products = products.filter(
        (p) => String(p.department_id) === String(currentUser.department_id)
      );
    }

    const matchedServices = services.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term)
    );

    const productResults = products.slice(0, 12).map((p) => ({ ...p, _type: "product" }));
    const serviceResults = matchedServices.slice(0, 8).map((s) => ({ ...s, _type: "service" }));

    return [...productResults, ...serviceResults];
  }, [unifiedSearchTerm, productsRaw, services, currentUser.role, currentUser.department_id]);

  // Initialize
  useEffect(() => {
    initializeUser();
    initializeThermalReceipt();
    loadData();

    return () => {
      stopPolling();
    };
  }, []);

  // Timer for date time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formattedDate = now
        .toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");
      setDateTime(formattedDate);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter customers
  useEffect(() => {
    if (customerSearchTerm.trim() === "") {
      setFilteredCustomers([]);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.customer_name
            ?.toLowerCase()
            .includes(customerSearchTerm.toLowerCase()) ||
          customer.phone_no_01?.includes(customerSearchTerm) ||
          customer.customer_code
            ?.toLowerCase()
            .includes(customerSearchTerm.toLowerCase()) ||
          customer.nic_no
            ?.toLowerCase()
            .includes(customerSearchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 8));
    }
  }, [customerSearchTerm, customers]);

  // Auto-set pay amount
  useEffect(() => {
    if (paymentStatus === "credit" && canUseCredit) {
      const cashPortion = payableTotal - creditAllocated;
      setPayAmount(cashPortion);
    } else if (paymentStatus !== "credit" && payAmount === 0 && payableTotal > 0) {
      setPayAmount(payableTotal);
    }
  }, [paymentStatus, canUseCredit, payableTotal, creditAllocated, payAmount]);

  // Load services function
  const fetchServices = async () => {
    try {
      const res = await api.get("/services");
      const activeServices = (res.data?.data || []).filter(
        (s) => s.status === true || s.status === 1
      );
      setServices(activeServices);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load services");
    }
  };

  // Initialization functions
  const initializeUser = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);

        setUserCode(user.user_code || "CH01");
        setCurrentUser({
          id: user.id || 0,
          user_code: user.user_code || "CH01",
          full_name: user.full_name || "System User",
          username: user.username || "system",
          role: user.role || "guest",
          department_id: user.department_id || null,
        });

        // If user is employee, set their department and lock it
        if (user.role === "employee" && user.department_id) {
          setDepartmentId(String(user.department_id));
          setIsDepartmentLocked(true);
          toast.success(`Logged in as ${user.full_name} (${user.role}) - Department locked`);
        } else {
          setIsDepartmentLocked(false);
        }
      } else {
        toast.error("Please login to create invoices");
      }
    } catch (error) {
      console.error("Error getting user from localStorage:", error);
      toast.error("Error loading user data");
    }
  };

  const initializeThermalReceipt = () => {
    const generateInvoiceNo = () => {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `${year}-200-${random}`;
    };

    if (!invoiceNo) {
      setInvoiceNo(generateInvoiceNo());
    }

    const savedAutoPrint = localStorage.getItem("auto_print_enabled");
    if (savedAutoPrint !== null) {
      setAutoPrintEnabled(savedAutoPrint === "true");
    }

    const updateDateTime = () => {
      const now = new Date();
      const formattedDate = now
        .toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");
      setDateTime(formattedDate);
    };

    updateDateTime();
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDepartments(),
      fetchCustomers(),
      fetchProducts(),
      fetchServices(),
      loadDrafts(),
    ]);
    setLoading(false);
  };

  // Data fetching functions
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      const list = res.data?.data || [];
      setDepartments(list);

      if (list.length > 0) {
        if (currentUser.role === "admin") {
          if (!departmentId) {
            setDepartmentId(String(list[0].id));
          }
        } else if (currentUser.role === "employee" && currentUser.department_id) {
          // Employee: Always use their assigned department
          const userDept = list.find((d) => d.id === currentUser.department_id);
          if (userDept) {
            setDepartmentId(String(userDept.id));
            toast.success(`Department locked to: ${userDept.department_name}`);
          } else {
            setDepartmentId(String(list[0].id));
            toast.warning("Your assigned department not found, using default");
          }
        } else {
          if (!departmentId) {
            setDepartmentId(String(list[0].id));
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load departments");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    }
  };

  const fetchProducts = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userForStock = currentUser?.user_code ? currentUser : storedUser;
      const activeDepartmentId =
        userForStock.role === "employee"
          ? userForStock.department_id
          : departmentId;

      if (!activeDepartmentId) {
        setProductsRaw([]);
        return;
      }

      const [stockRes, productsRes] = await Promise.all([
        api.get("/grns/stock", { params: { department_id: activeDepartmentId } }),
        api.get("/products"),
      ]);

      const rawStock = stockRes.data?.data || [];
      const productDetails = productsRes.data?.data || [];

      const mapped = rawStock.map((p) => {
        const batches = [...(p.batches || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        const total_qty = Number(p.total_qty ?? batches.reduce((s, b) => s + Number(b.qty || 0), 0));
        const latest =
          [...batches].sort((a, b) => new Date(b.date) - new Date(a.date))[0] ||
          {};

        const productDetail =
          productDetails.find((prod) => prod.product_code === p.product_code) ||
          {};

        return {
          product_code: p.product_code,
          product_name: p.product_name,
          total_qty,
          selling_price: Number(latest.selling_price || 0),
          discount_price: Number(latest.discount_price || 0),
          batches,
          type: "product",
          description: p.product_name,
          brand_name: productDetail.brand_name || "",
          category: productDetail.category || "",
          group: productDetail.group || "",
          size: productDetail.size || "",
          pattern: productDetail.pattern || "",
          full_description: productDetail.description || "",
          model: productDetail.model || "",
          unit: productDetail.unit || "pcs",
          location: productDetail.location || "",
          min_stock: productDetail.min_stock || 0,
          reorder_level: productDetail.reorder_level || 0,
          department_id: latest.department_id || activeDepartmentId,
        };
      });

      setProductsRaw(mapped);
    } catch (err) {
      console.error("Error in fetchProducts:", err);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    if (!loading && departmentId) {
      fetchProducts();
    }
  }, [departmentId, currentUser.role, currentUser.department_id, loading]);

  // Customer search functions
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer.customer_code);
    setCustomerSearchTerm(customer.customer_name);
    setShowCustomerSuggestions(false);
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer("");
    setCustomerSearchTerm("");
    setShowCustomerSuggestions(false);
  };

  // Cart functions
  const addToCart = (product) => {
    // Check if product belongs to employee's department
    if (currentUser.role === "employee" && currentUser.department_id) {
      if (String(product.department_id) !== String(currentUser.department_id)) {
        toast.error("This product is not available in your department");
        return;
      }
    }

    if (!product || (product.total_qty <= 0 && product.type === "product"))
      return toast.error("Out of stock");

    const existingItem = cart.find(
      (item) =>
        item.product_code === product.product_code && item.type === "product"
    );

    if (existingItem) {
      if (existingItem.qty >= product.total_qty) {
        return toast.error("Not enough stock");
      }
      setCart(
        cart.map((item) =>
          item.product_code === existingItem.product_code &&
          item.type === "product"
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_code: product.product_code,
          product_name: product.product_name,
          qty: 1,
          selling_price: product.selling_price,
          requested_discount: 0,
          applied_discount: 0,
          available_qty: product.total_qty,
          type: "product",
          description:
            product.full_description ||
            product.description ||
            product.product_name,
          brand_name: product.brand_name || "",
          category: product.category || "",
          group: product.group || "",
          size: product.size || "",
          pattern: product.pattern || "",
          full_description: product.full_description || "",
          model: product.model || "",
          unit: product.unit || "pcs",
          location: product.location || "",
          department_id: product.department_id,
        },
      ]);
    }

    setProductSearchTerm("");
    toast.success(`${product.product_name} added to cart`);
  };

  const addServiceToCart = (service) => {
    const serviceItem = {
      service_id: service.id,
      product_name: service.name,
      product_code: `SVC-${service.id}`,
      qty: 1,
      selling_price: Number(service.price),
      requested_discount: 0,
      applied_discount: 0,
      available_qty: 999,
      type: "service",
      description: service.description || service.name,
      category: service.category || "service",
    };

    setCart((prev) => [...prev, serviceItem]);
    setServiceSearchTerm("");
    toast.success(`${service.name} added to cart`);
  };

  const handleServiceAddedFromManager = (service) => {
    addServiceToCart(service);
  };

  const addCustomService = async (serviceData = null) => {
    let serviceToAdd = serviceData;

    if (!serviceToAdd) {
      if (!newService.name || !newService.price) {
        toast.error("Service name and price are required");
        return;
      }

      try {
        const res = await api.post("/services", {
          name: newService.name,
          price: Number(newService.price),
          description: newService.description || "",
          category: newService.category || "custom",
          status: true,
        });

        serviceToAdd = res.data?.data;
        if (!serviceToAdd) {
          toast.error("Failed to create service");
          return;
        }

        await fetchServices();

        setNewService({
          name: "",
          price: 0,
          description: "",
          category: "custom",
          type: "service",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to create custom service");
        return;
      }
    }

    addServiceToCart(serviceToAdd);
    setIsServiceDialogOpen(false);
    toast.success("Service added to cart");
  };

  const updateQty = (itemId, newQty, itemType = "product") => {
    if (itemType === "service") return;

    setCart(
      cart.map((item) => {
        if (itemType === "product" && item.product_code === itemId) {
          const product = productsRaw.find((p) => p.product_code === itemId);
          const maxQty = product ? product.total_qty : item.available_qty;
          const qty = Math.max(1, Math.min(newQty, maxQty));
          return { ...item, qty };
        }
        return item;
      })
    );
  };

  const updateRequestedDiscount = (itemId, discount, itemType = "product") => {
    setCart(
      cart.map((item) => {
        if (
          (itemType === "product" && item.product_code === itemId) ||
          (itemType === "service" && item.service_id === itemId)
        ) {
          const discountValue = Math.max(0, Number(discount || 0));

          if (itemType === "service") {
            return {
              ...item,
              requested_discount: discountValue,
              applied_discount: discountValue,
            };
          }

          return {
            ...item,
            requested_discount: discountValue,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId, itemType = "product") => {
    const item = cart.find(
      (item) =>
        (itemType === "product" && item.product_code === itemId) ||
        (itemType === "service" && item.service_id === itemId)
    );

    setCart(
      cart.filter(
        (item) =>
          !(
            (itemType === "product" && item.product_code === itemId) ||
            (itemType === "service" && item.service_id === itemId)
          )
      )
    );

    if (item) {
      toast.success(`${item.product_name} removed from cart`);
    }
  };

  // Discount Request Modal Functions
  const openDiscountRequestModal = (item) => {
    setDiscountRequestModal({
      isOpen: true,
      itemId: item.type === "product" ? item.product_code : item.service_id,
      productCode: item.product_code,
      productName: item.product_name,
      currentPrice: item.selling_price,
      requestedDiscount: item.requested_discount || 0,
      reason: "",
      itemType: item.type || "product",
    });
  };

  const closeDiscountRequestModal = () => {
    setDiscountRequestModal({
      isOpen: false,
      itemId: "",
      productCode: "",
      productName: "",
      currentPrice: 0,
      requestedDiscount: 0,
      reason: "",
      itemType: "product",
    });
  };

  const submitDiscountRequest = async () => {
    const { productCode, productName, requestedDiscount, reason, itemType } =
      discountRequestModal;

    if (!requestedDiscount || requestedDiscount <= 0) {
      toast.error("Please enter a valid discount amount");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the discount request");
      return;
    }

    try {
      setCart(
        cart.map((item) => {
          if (itemType === "product" && item.product_code === productCode) {
            return { ...item, requested_discount: Number(requestedDiscount) };
          } else if (
            itemType === "service" &&
            item.service_id === discountRequestModal.itemId
          ) {
            return {
              ...item,
              requested_discount: Number(requestedDiscount),
            };
          }
          return item;
        })
      );

      if (itemType === "product") {
        const payload = {
          inv_date: new Date().toISOString().split("T")[0],
          customer_type: customerType,
          department_id: Number(departmentId),
          type: invoiceType,
          service: serviceDescription || "Tire Service",
          payment_status: "pending",
          total_amount: totalAmount,
          total_discount:
            totalDiscount +
            (requestedDiscount *
              cart.find((i) => i.product_code === productCode)?.qty || 1),
          net_total:
            netTotal -
            (requestedDiscount *
              cart.find((i) => i.product_code === productCode)?.qty || 1),
          pay_amount: 0,
          credit_paid: 0,
          balance:
            netTotal -
            (requestedDiscount *
              cart.find((i) => i.product_code === productCode)?.qty || 1),
          credit_allocated: 0,
          remaining_balance:
            netTotal -
            (requestedDiscount *
              cart.find((i) => i.product_code === productCode)?.qty || 1),
          is_credit_paid: false,
          inv_by: currentUser.user_code,
          note: note || "",
          is_draft: true,
          items: cart.map((i) => ({
            product_code: i.product_code,
            product_name: i.product_name,
            qty: Number(i.qty),
            selling_price: Number(i.selling_price),
            discount:
              i.type === "service"
                ? Number(i.applied_discount || i.requested_discount || 0)
                : i.product_code === productCode
                ? Number(requestedDiscount)
                : Number(i.requested_discount || 0),
            description: i.description || i.product_name,
            type: i.type || "product",
          })),
        };

        if (customerType === "save" && selectedCustomer) {
          payload.customer_code = selectedCustomer;
        }

        const res = await api.post("/invoices", payload);
        const createdInvoice = res.data?.data;

        if (!createdInvoice || !createdInvoice.inv_no) {
          toast.error("Failed to create invoice draft for discount request");
          return;
        }

        await api.post("/discount-requests", {
          inv_no: createdInvoice.inv_no,
          product_code: productCode,
          original_price:
            cart.find((i) => i.product_code === productCode)?.selling_price ||
            0,
          requested_discount: Number(requestedDiscount),
          reason: reason,
        });

        setDraftInvoiceNo(createdInvoice.inv_no);
        setRequestStatusMap((prev) => ({
          ...prev,
          [productCode]: "pending",
        }));
        startPolling(createdInvoice.inv_no);
      }

      toast.success(`Discount request submitted for ${productName}`);
      closeDiscountRequestModal();
    } catch (err) {
      console.error("Error submitting discount request:", err);
      toast.error("Failed to submit discount request");
    }
  };

  // Customer functions
  const createCustomer = async () => {
    if (!newCustomer.customer_name?.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!newCustomer.phone_no_01?.trim()) {
      toast.error("Primary phone number is required");
      return;
    }

    if (!newCustomer.nic_no?.trim()) {
      toast.error("NIC number is required");
      return;
    }

    try {
      if (currentUser.role === "employee" && currentUser.department_id) {
        newCustomer.department_id = String(currentUser.department_id);
      }

      const res = await api.post("/customers", newCustomer);
      const created = res.data?.data;

      await fetchCustomers();

      setSelectedCustomer(created.customer_code);
      setCustomerSearchTerm(created.customer_name);

      setIsCustomerDialogOpen(false);

      setNewCustomer({
        customer_name: "",
        address: "",
        phone_no_01: "",
        phone_no_02: "",
        nic_no: "",
        department_id:
          currentUser.role === "employee" && currentUser.department_id
            ? String(currentUser.department_id)
            : "",
        credit_limit: 0,
        credit_enabled: false,
        credit_balance: 0,
      });

      toast.success("Customer created successfully");
    } catch (err) {
      console.error("Error creating customer:", err);
      toast.error(err.response?.data?.message || "Failed to create customer");
    }
  };

  // Draft functions
  const loadDrafts = () => {
    try {
      const list = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
      setDrafts(list);
    } catch {
      setDrafts([]);
    }
  };

  const saveDraftLocal = (name) => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const id = Date.now();
    const draft = {
      id,
      name: name || `Draft ${new Date(id).toLocaleString()}`,
      created_at: new Date().toISOString(),
      departmentId,
      customerType,
      selectedCustomer,
      paymentStatus,
      payAmount,
      note,
      cart,
      invoiceNo,
      dateTime,
    };
    const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
    existing.push(draft);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(existing));
    setDrafts(existing);
    toast.success("Draft saved locally");
  };

  const applyDraft = (d) => {
    if (currentUser.role === "admin") {
      setDepartmentId(d.departmentId || departmentId);
    }
    setCustomerType(d.customerType || "cash");
    setSelectedCustomer(d.selectedCustomer || "");
    setCustomerSearchTerm(
      d.selectedCustomer
        ? customers.find((c) => c.customer_code === d.selectedCustomer)
            ?.customer_name || ""
        : ""
    );
    setPaymentStatus(d.paymentStatus || "cash");
    setPayAmount(d.payAmount || 0);
    setNote(d.note || "");
    setCart(d.cart || []);
    setInvoiceNo(d.invoiceNo || invoiceNo);
    setIsDraftsOpen(false);
    toast.success("Draft applied");
  };

  const removeDraft = (id) => {
    const remaining = (
      JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]") || []
    ).filter((r) => r.id !== id);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(remaining));
    setDrafts(remaining);
    toast.success("Draft deleted");
  };

  // Polling functions
  const startPolling = (inv_no) => {
    if (!inv_no) return;
    stopPolling();
    setPollingActive(true);

    const poll = async () => {
      try {
        const res = await api.get("/discount-requests");
        const all = res.data?.data || [];
        const forInvoice = all.filter((r) => r.inv_no === inv_no);

        const newMap = { ...(requestStatusMap || {}) };
        for (const r of forInvoice) {
          const requestId = `${r.product_code}-${r.status}`;

          if (!processedRequestsRef.current.has(requestId)) {
            processedRequestsRef.current.add(requestId);

            if (r.status === "approved") {
              toast.success(
                `Discount approved for ${r.product_code} - LKR ${r.requested_discount}`,
                {
                  duration: 3000,
                }
              );
            } else if (r.status === "rejected") {
              toast.error(`Discount rejected for ${r.product_code}`, {
                duration: 3000,
              });
            }
          }

          newMap[r.product_code] = r.status;
          if (r.status === "approved") {
            setCart((prevCart) =>
              prevCart.map((ci) => {
                if (ci.product_code === r.product_code) {
                  const rd = Number(r.requested_discount || 0);
                  if (ci.applied_discount !== rd) {
                    return { ...ci, applied_discount: rd };
                  }
                }
                return ci;
              })
            );
          }
          if (r.status === "rejected" || r.status === "cancelled") {
            setCart((prevCart) =>
              prevCart.map((ci) => {
                if (ci.product_code === r.product_code) {
                  return { ...ci, applied_discount: 0 };
                }
                return ci;
              })
            );
          }
        }

        setRequestStatusMap(newMap);

        const requestedProductCodes = Object.keys(newMap);
        if (requestedProductCodes.length > 0) {
          const anyPending = requestedProductCodes.some(
            (code) => newMap[code] === "pending"
          );
          if (!anyPending) {
            stopPolling();
            toast.success("All discount requests processed for this draft.", {
              duration: 4000,
            });
          }
        } else {
          stopPolling();
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 1000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPollingActive(false);
  };

  // Helper functions
  const getRequestBadge = (product_code) => {
    const st = requestStatusMap[product_code];
    if (!st) return null;
    if (st === "pending")
      return (
        <Badge variant="secondary" className="text-xs">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Pending
        </Badge>
      );
    if (st === "approved")
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          ✓ Approved
        </Badge>
      );
    if (st === "rejected")
      return (
        <Badge variant="destructive" className="text-xs">
          ✗ Rejected
        </Badge>
      );
    if (st === "cancelled")
      return (
        <Badge variant="outline" className="text-xs">
          Cancelled
        </Badge>
      );
    if (st === "error")
      return (
        <Badge variant="destructive" className="text-xs">
          Error
        </Badge>
      );
    return null;
  };

// THERMAL RECEIPT PRINTING 
const printThermalReceipt = (invoiceData = null) => {
  try {
    const currentDepartment = departments.find(
      (d) => String(d.id) === departmentId
    );

    const departmentName =
      currentDepartment?.department_name || "Main Department";
    const departmentAddress = currentDepartment?.department_address || "";
    const departmentContact = currentDepartment?.department_contact || "";

    const customerName =
      selectedCustomerDetails?.customer_name || "Cash Sale";
    const customerPhone = selectedCustomerDetails?.phone_no_01 || "";

    const creatorName = currentUser?.full_name || "System User";

    const totalAmountCalc = cart.reduce(
      (s, i) => s + Number(i.selling_price || 0) * Number(i.qty || 0),
      0
    );

    const totalDiscountCalc = cart.reduce(
      (s, i) => s + Number(i.applied_discount || 0) * Number(i.qty || 0),
      0
    );

    const netTotalCalc = totalAmountCalc - totalDiscountCalc;
    const cardSurchargeCalc = paymentStatus === "card" ? netTotalCalc * 3 / 100 : 0;
    const effectiveNetTotalCalc = netTotalCalc + cardSurchargeCalc;

    let cashPaid = Number(payAmount || 0);
    let balanceAmount = 0;
    let balanceLabel = "Balance";

    if (paymentStatus === "credit") {
      cashPaid = Math.max(0, effectiveNetTotalCalc - creditAllocated);
      balanceAmount = Math.max(0, effectiveNetTotalCalc - creditAllocated - cashPaid);
      balanceLabel = balanceAmount > 0 ? "Due" : "Balance";
    } else {
      if (cashPaid >= effectiveNetTotalCalc) {
        balanceAmount = cashPaid - effectiveNetTotalCalc;
        balanceLabel = "Balance";
      } else {
        balanceAmount = effectiveNetTotalCalc - cashPaid;
        balanceLabel = "Due";
      }
    }

    // Helper function to clean product name (remove parentheses and content)
    const cleanProductName = (productName) => {
      if (!productName) return "";
      // Remove everything inside parentheses including the parentheses
      return productName
    };

    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${invoiceNo}</title>

  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }

    body {
      width: 80mm;
      margin: 0;
      padding: 6mm;
      font-family: "Courier New", monospace;
      font-size: 14px;
      font-weight: 900;
      line-height: 1.45;
      color: #000;
    }

    .center { text-align: center; }

    .header {
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .shop-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .dept {
      font-size: 12px;
      font-weight: 900;
      margin-top: 3px;
    }

    .info {
      font-size: 13px;
      font-weight: 900;
      margin: 6px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    th {
      font-size: 13px;
      font-weight: 900;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      text-align: left;
      text-transform: uppercase;
    }

    td {
      padding: 4px 0;
      vertical-align: top;
      border-bottom: 1px dashed #000;
      font-weight: 900;
      color: #000;
    }

    .qty { 
      width: 12mm; 
      text-align: center; 
      padding-right: 2mm;
      font-weight: 900;
      font-size: 13px;
    }
    .desc { 
      width: 44mm; 
      padding-right: 2mm;
      word-wrap: break-word;
    }
    .amt { 
      width: 18mm; 
      text-align: right; 
      font-weight: 900;
      font-size: 13px;
    }

    /* ENHANCED PRODUCT DETAILS */
    .product-item {
      margin-bottom: 2px;
    }
    
    .product-name {
      font-weight: 900;
      font-size: 14px;
      line-height: 1.3;
      margin-bottom: 1px;
      color: #000;
    }
    
    .product-price-details {
      font-weight: 900;
      font-size: 11px;
      color: #000;
      margin-top: 2px;
    }

    .price-breakdown {
      font-weight: 900;
      font-size: 10px;
      color: #000;
    }

    .totals {
      margin-top: 10px;
      border-top: 1px dashed #000;
      padding-top: 8px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-weight: 900;
    }

    .grand {
      font-size: 16px;
      font-weight: 900;
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 8px;
      text-transform: uppercase;
    }

    .barcode {
      font-family: "Libre Barcode 39", monospace;
      font-size: 32px;
      text-align: center;
      margin: 14px 0;
      font-weight: 400;
    }

    .footer {
      font-size: 11px;
      font-weight: 900;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      line-height: 1.4;
    }

    .custom-note {
      font-size: 11px;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px dashed #ccc;
      word-wrap: break-word;
      font-weight: 900;
    }
    
    .credit-section {
      background-color: #f0f0f0;
      padding: 6px;
      margin: 6px 0;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 900;
      border: 1px dashed #000;
    }
    
    .highlight-box {
      background-color: #f8f8f8;
      padding: 3px;
      margin: 3px 0;
      border-radius: 2px;
    }
    
    /* Payment status indicators */
    .paid {
      color: #000;
      font-weight: 900;
    }

    .due {
      color: #000;
      font-weight: 900;
    }

    .discount {
      color: #000;
      font-weight: 900;
    }
    
    /* ENHANCED BALANCE STYLING - BLACK COLOR WITH SAME FONT WEIGHT AS TOTAL */
    .balance-section {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 2px dashed #000;
    }
    
    .balance-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-weight: 900;
      font-size: 14px;
    }
    
    /* UPDATED: Black color for balance with same weight as total */
    .balance-final {
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 0.5px;
      color: #000000;
    }
    
    .balance-due {
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 0.5px;
      color: #000000;
    }
    
    .balance-paid {
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 0.5px;
      color: #000000;
    }
    
    /* Balance summary section */
    .balance-summary {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px solid #000;
    }
    
    .balance-summary-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-weight: 900;
      font-size: 15px;
      color: #000000;
    }
    
    /* Final balance with same style as total amount */
    .final-balance {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-weight: 900;
      font-size: 16px;
      color: #000000;
      padding-top: 8px;
      border-top: 2px solid #000;
    }
  </style>

  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>

<body>

  <div class="header center">
    <div class="shop-name">${departmentName}</div>
    ${departmentAddress ? `<div class="dept">${departmentAddress}</div>` : ""}
    ${
      departmentContact
        ? `<div class="dept">Tel: ${departmentContact}</div>`
        : ""
    }
  </div>

  <div class="info center">
    <div>Invoice: ${invoiceNo}</div>
    <div>${dateTime}</div>
  </div>

  <div class="info center">
    <span>Cashier:</span> ${creatorName}
  </div>

  ${
    customerType === "save"
      ? `
    <div class="info highlight-box">
      <div>CUSTOMER DETAILS</div>
      <div>${customerName}</div>
      ${customerPhone ? `<div>Tel: ${customerPhone}</div>` : ""}
    </div>
  `
      : ""
  }

  ${
    paymentStatus === "credit"
      ? `
    <div class="credit-section">
      <div style="text-align: center;">CREDIT PAYMENT</div>
      <div>Credit Allocated: Rs.${creditAllocated.toFixed(2)}</div>
    </div>
  `
      : ""
  }

  <table>
    <thead>
      <tr>
        <th class="qty">QTY</th>
        <th class="desc">ITEM</th>
        <th class="amt">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${cart
        .map(
          (i) => `
        <tr>
          <td class="qty">${i.qty}</td>
          <td class="desc">
            <div class="product-item">
              <div class="product-name">${cleanProductName(i.product_name || i.description || "Item")}</div>
              ${
                i.applied_discount > 0
                  ? `
                <div class="product-price-details">
                  Price: Rs.${i.selling_price?.toFixed(2) || "0.00"}
                  ${
                    i.applied_discount > 0
                      ? `<span class="discount">(-${i.applied_discount})</span>`
                      : ""
                  }
                </div>
                `
                  : ""
              }
            </div>
          </td>
          <td class="amt">
            Rs.${(i.qty * i.selling_price).toFixed(2)}
          </td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Sub Total</span>
      <span>Rs.${totalAmountCalc.toFixed(2)}</span>
    </div>

    ${
      totalDiscountCalc > 0
        ? `
    <div class="row">
      <span class="discount">Discount</span>
      <span class="discount">-Rs.${totalDiscountCalc.toFixed(2)}</span>
    </div>
    `
        : ""
    }

    ${cardSurchargeCalc > 0 ? `
    <div class="row">
      <span>Card Surcharge (3%)</span>
      <span>Rs.${cardSurchargeCalc.toFixed(2)}</span>
    </div>
    ` : ""}

    <div class="row grand">
      <span>TOTAL AMOUNT</span>
      <span>Rs.${effectiveNetTotalCalc.toFixed(2)}</span>
    </div>
  </div>

  <!-- UPDATED BALANCE SECTION - BLACK COLOR WITH SAME WEIGHT AS TOTAL -->
  <div class="balance-section">
    ${
      paymentStatus === "credit"
        ? `
      <div class="balance-row">
        <span>Credit Used</span>
        <span class="balance-final">Rs.${creditAllocated.toFixed(2)}</span>
      </div>
    `
        : ""
    }
    
    <div class="balance-row">
      <span>Cash Paid</span>
      <span class="balance-final">Rs.${cashPaid.toFixed(2)}</span>
    </div>
  </div>
  
  <!-- FINAL BALANCE - SAME STYLE AS TOTAL AMOUNT -->
  <div class="final-balance">
    <span>${balanceLabel === "Due" ? "DUE AMOUNT" : "BALANCE"}</span>
    <span class="balance-final">
      ${balanceLabel === "Due" ? "(Rs." : "Rs."}${balanceAmount.toFixed(2)}${balanceLabel === "Due" ? ")" : ""}
    </span>
  </div>

  ${
    note
      ? `
  <div class="custom-note">
    <div>CUSTOMER NOTE:</div>
    <div>${note}</div>
  </div>
  `
      : ""
  }

  <div class="barcode">
    *${invoiceNo.replace(/-/g, "")}*
  </div>

  <div class="footer">
    <div style="margin-bottom: 4px;">THANK YOU!</div>
    <div>Goods once sold cannot be returned</div>
    <div style="margin-top: 4px; font-size: 10px;">Invoice Valid for 7 Days</div>
  </div>

</body>
</html>
`;

    const printWindow = window.open("", "_blank", "width=400,height=650");
    if (!printWindow) {
      toast.error("Popup blocked. Allow popups to print.");
      return;
    }

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 800);
    }, 400);
  } catch (err) {
    console.error(err);
    toast.error("Print failed");
  }
};

  const download80mmPDF = (invoiceData = null) => {
    try {
      toast.info("PDF download functionality would be implemented here");
      printThermalReceipt(invoiceData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleManualPrint = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    printThermalReceipt();
  };

  const handleDownload80mmPDF = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    download80mmPDF();
  };

  const saveDraftAndCreateRequestsOnServer = async () => {
    if (!departmentId) return toast.error("Select department");
    if (customerType === "save" && !selectedCustomer)
      return toast.error("Select a customer");
    if (cart.length === 0) return toast.error("Cart is empty");

    if (paymentStatus === "credit" && !canUseCredit) {
      toast.error(
        "No available credit. Cannot create invoice with credit payment."
      );
      return;
    }

    const backendService =
      serviceDescription ||
      (invoiceType === "tire" ? "Tire Service" : "Service");

    const updatedCart = cart.map((item) => {
      if (item.type === "service" && item.requested_discount > 0) {
        return {
          ...item,
          applied_discount: item.requested_discount,
        };
      }
      return item;
    });
    setCart(updatedCart);

    const draftBalance =
      paymentStatus === "credit"
        ? Math.max(0, netTotal - creditAllocated - cashPaymentAmount)
        : payAmount >= netTotal
        ? payAmount - netTotal
        : netTotal - payAmount;

    const payload = {
      inv_date: new Date().toISOString().split("T")[0],
      customer_type: customerType,
      department_id: Number(departmentId),
      type: invoiceType,
      service: backendService,
      payment_status: paymentStatus,
      total_amount: totalAmount,
      total_discount: totalDiscount,
      net_total: netTotal,
      pay_amount: cashPaymentAmount,
      credit_paid: creditAllocated,
      balance: draftBalance,
      credit_allocated: creditAllocated,
      remaining_balance: draftBalance,
      is_credit_paid: paymentStatus === "credit" ? false : true,
      inv_by: currentUser.user_code,
      note: note || "",
      is_draft: true,
      items: updatedCart.map((i) => ({
        product_code: i.product_code,
        product_name: i.product_name,
        qty: Number(i.qty),
        selling_price: Number(i.selling_price),
        discount:
          i.type === "service"
            ? Number(i.applied_discount || i.requested_discount || 0)
            : Number(i.requested_discount || 0),
        description: i.description || i.product_name,
        type: i.type || "product",
      })),
    };

    if (customerType === "save" && selectedCustomer) {
      payload.customer_code = selectedCustomer;
    }

    try {
      const res = await api.post("/invoices", payload);
      const createdInvoice = res.data?.data;
      if (!createdInvoice || !createdInvoice.inv_no) {
        toast.error("Server did not return inv_no for draft invoice.");
        return;
      }
      toast.success(`Draft invoice created: ${createdInvoice.inv_no}`);
      setDraftInvoiceNo(createdInvoice.inv_no);
      setInvoiceNo(createdInvoice.inv_no);

      const discountItems = updatedCart.filter(
        (i) => i.type === "product" && Number(i.requested_discount || 0) > 0
      );
      const newStatusMap = {};
      for (const item of discountItems) {
        newStatusMap[item.product_code] = "pending";
      }
      setRequestStatusMap((prev) => ({ ...prev, ...newStatusMap }));

      for (const item of discountItems) {
        try {
          await api.post("/discount-requests", {
            inv_no: createdInvoice.inv_no,
            product_code: item.product_code,
            original_price: item.selling_price,
            requested_discount: Number(item.requested_discount || 0),
            reason: `Requested on invoice draft ${createdInvoice.inv_no}`,
          });
        } catch (err) {
          console.error(
            "Error creating discount request for",
            item.product_code,
            err
          );
          toast.error(
            `Failed to create discount request for ${item.product_name}`
          );
          setRequestStatusMap((prev) => ({
            ...prev,
            [item.product_code]: "error",
          }));
        }
      }

      if (discountItems.length > 0) {
        startPolling(createdInvoice.inv_no);
        toast.success(
          "Product discount requests filed (awaiting admin approval). Service discounts applied directly."
        );
      } else {
        toast.success(
          "Draft invoice created. Service discounts applied directly."
        );
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || "Failed to create draft invoice";
      toast.error(msg);
    }
  };

  const handleCreateInvoice = async () => {
    if (customerType === "save" && !selectedCustomer)
      return toast.error("Select a customer");
    if (!departmentId) return toast.error("Select department");
    if (cart.length === 0) return toast.error("Cart is empty");

    if (paymentStatus === "credit" && !canUseCredit) {
      toast.error(
        "No available credit. Cannot create invoice with credit payment."
      );
      return;
    }

    const anyRequestedPending = cart.some(
      (i) =>
        i.type === "product" &&
        Number(i.requested_discount || 0) > 0 &&
        (requestStatusMap[i.product_code] === "pending" ||
          !requestStatusMap[i.product_code])
    );
    if (anyRequestedPending) {
      toast.error(
        "Some product discounts are still pending admin approval. Use 'Save Draft & Request Discounts' and wait for admin approval before finalizing."
      );
      return;
    }

    const backendService =
      serviceDescription ||
      (invoiceType === "tire" ? "Tire Service" : "Service");

    const finalBalance =
      paymentStatus === "credit"
        ? Math.max(0, payableTotal - creditAllocated - cashPaymentAmount)
        : payAmount >= payableTotal
        ? payAmount - payableTotal
        : payableTotal - payAmount;

    const paidTowardsInvoice =
      paymentStatus === "credit"
        ? cashPaymentAmount
        : Math.min(payableTotal, Number(payAmount || 0));

    const payload = {
      inv_date: new Date().toISOString().split("T")[0],
      customer_type: customerType,
      department_id: Number(departmentId),
      type: invoiceType,
      service: backendService,
      payment_status: paymentStatus,
      total_amount: totalAmount,
      total_discount: totalDiscount,
      net_total: payableTotal,
      pay_amount: paidTowardsInvoice,
      credit_paid: 0,
      balance: finalBalance,
      credit_allocated: creditAllocated,
      remaining_balance: finalBalance,
      is_credit_paid: paymentStatus === "credit" ? false : true,
      inv_by: currentUser.user_code,
      note: note || "",
      items: cart.map((i) => ({
        product_code: i.product_code,
        product_name: i.product_name,
        qty: Number(i.qty),
        selling_price: Number(i.selling_price),
        discount:
          i.type === "service"
            ? Number(i.applied_discount || i.requested_discount || 0)
            : Number(i.applied_discount || 0),
        description: i.description || i.product_name,
        type: i.type || "product",
      })),
    };

    if (customerType === "save" && selectedCustomer) {
      payload.customer_code = selectedCustomer;
    }

    try {
      const res = await api.post("/invoices", payload);
      const invoice = res.data?.data || payload;

      toast.success("Invoice created successfully!");

      if (invoice.inv_no) {
        setInvoiceNo(invoice.inv_no);
      }

      if (autoPrintEnabled) {
        setTimeout(() => {
          printThermalReceipt(invoice);
        }, 500);
      } else {
        setTimeout(() => {
          if (
            window.confirm(
              "Invoice created successfully! Would you like to print the thermal receipt?"
            )
          ) {
            printThermalReceipt(invoice);
          }
        }, 500);
      }

      setTimeout(() => {
        download80mmPDF(invoice);
      }, 1000);

      setCart([]);
      setSelectedCustomer("");
      setCustomerSearchTerm("");
      setPayAmount(0);
      setNote("");
      fetchCustomers();
      fetchProducts();
      setDraftInvoiceNo(null);
      setRequestStatusMap({});
      processedRequestsRef.current.clear();
      stopPolling();

      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      setInvoiceNo(`${year}-200-${random}`);
    } catch (err) {
      console.error("Error creating invoice:", err);
      const msg = err?.response?.data?.message || "Failed to create invoice";
      toast.error(msg);
    }
  };

  const generateNewInvoiceNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const newInvoiceNo = `${year}-200-${random}`;
    setInvoiceNo(newInvoiceNo);
    toast.success("New invoice number generated");
  };

  const toggleAutoPrint = () => {
    const newValue = !autoPrintEnabled;
    setAutoPrintEnabled(newValue);
    localStorage.setItem("auto_print_enabled", newValue.toString());
    toast.success(`Auto print ${newValue ? "enabled" : "disabled"}`);
  };

  const handleNavbarClick = (dialogName) => {
    setActiveDialog(dialogName);
  };

  if (loading) return <LoadingSpinner />;

  function MiniTotal({ label, value, negative = false, bold = false }) {
  return (
    <div className="text-right">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div
        className={[
          "text-[12px]",
          bold ? "font-bold text-blue-700" : "font-semibold text-gray-900",
          negative ? "text-orange-600" : "",
        ].join(" ")}
      >
        {negative ? "- " : ""}
        LKR {Number(value || 0).toLocaleString()}
      </div>
    </div>
  );
}


return (
  <div className="h-screen w-full bg-[#F5F7FA] overflow-hidden">
    <div className="h-full flex flex-col overflow-hidden">

      {/* TOP TOOL STRIP — 2 rows */}
      <div className="bg-white border-b shadow-sm">

        {/* ROW 1: Department */}
        <div className="px-4 py-2 flex items-center gap-3 border-b border-gray-100">
          <span className="text-[11px] text-gray-500 whitespace-nowrap">Department</span>
          <Select value={departmentId} onValueChange={setDepartmentId} disabled={isDepartmentLocked}>
            <SelectTrigger className="h-8 w-[240px] text-xs bg-white">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.department_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDepartmentLocked ? (
            <Badge variant="outline" className="h-8 text-[11px]"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
          ) : (
            <Badge variant="outline" className="h-8 text-[11px]"><Unlock className="h-3 w-3 mr-1" />Open</Badge>
          )}
        </div>

        {/* ROW 2: Action buttons + Net Total */}
        <div className="px-4 py-2 flex items-center justify-between gap-2">

          {/* Buttons — full width flex, wrap-safe */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "Customer", action: () => setActiveDialog("customer"),          disabled: false,                             color: "bg-violet-600 hover:bg-violet-700 text-white" },
              { label: "Payment",  action: () => setActiveDialog("payment"),           disabled: !departmentId,                     color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
              { label: "Discount", action: () => saveDraftAndCreateRequestsOnServer(), disabled: pollingActive || cart.length === 0, color: "bg-orange-500 hover:bg-orange-600 text-white" },
              { label: "Drafts",   action: () => setIsDraftsOpen(true),               disabled: false,                             color: "bg-sky-500 hover:bg-sky-600 text-white" },
              { label: "Save",     action: () => saveDraftLocal(),                     disabled: cart.length === 0,                 color: "bg-teal-600 hover:bg-teal-700 text-white" },
              { label: "Note",     action: () => setIsNoteDialogOpen(true),            disabled: false,                             color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
              { label: "Print",    action: () => handleManualPrint(),                  disabled: cart.length === 0,                 color: "bg-rose-600 hover:bg-rose-700 text-white" },
            ].map(({ label, action, disabled, color }) => (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide shadow-sm transition-all whitespace-nowrap
                  ${disabled
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
                    : `${color} active:scale-95`
                  }
                `}
              >
                {label}
                {label === "Discount" && pollingActive && (
                  <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Net Total Blue Box — always visible, right side */}
          <div className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 text-white min-w-[180px] text-right">
            <div className="text-[10px] opacity-80 font-medium uppercase tracking-wide">
              Net Total{paymentStatus === "card" && <span className="ml-1 text-yellow-300">(+3% card)</span>}
            </div>
            <div className="text-[20px] font-extrabold leading-tight">
              LKR {Number(effectiveNetTotal || 0).toLocaleString()}
            </div>
            <div className="text-[10px] opacity-80">
              {isBalanceChange ? "Change" : "Due"}:{" "}
              <span className="font-bold">LKR {Math.abs(balance).toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>

      {/* FULL VIEW CART */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
          {/* Cart Header — title only, buttons are in top toolbar */}
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Cart Items</span>
            <span className="text-xs text-gray-400">({cart.length})</span>
            {pollingActive && (
              <span className="ml-1 inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-blue-50 text-blue-700 text-[11px]">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Tracking
              </span>
            )}
            {paymentStatus === "card" && cardSurcharge > 0 && (
              <span className="ml-auto text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                Card surcharge +LKR {cardSurcharge.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* ── Unified Search Bar ─────────────────────────────────── */}
          <div className="px-3 py-2 border-b relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition"
                placeholder="Search products & services and click to add..."
                value={unifiedSearchTerm}
                disabled={!departmentId}
                onChange={(e) => setUnifiedSearchTerm(e.target.value)}
              />
              {unifiedSearchTerm && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setUnifiedSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {unifiedSearchTerm.trim() && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-40 max-h-72 overflow-auto">
                {filteredUnified.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">No results found.</div>
                ) : (
                  filteredUnified.map((item) =>
                    item._type === "product" ? (
                      <button
                        key={`p-${item.product_code}`}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b last:border-0 flex items-center justify-between gap-3 transition"
                        onClick={() => { addToCart(item); setUnifiedSearchTerm(""); }}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</div>
                          <div className="text-[11px] text-gray-400 flex gap-2 mt-0.5">
                            <span className="font-mono">{item.product_code}</span>
                            {item.brand_name && <span>{item.brand_name}</span>}
                            {item.size && <span>{item.size}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-gray-800">LKR {Number(item.selling_price || 0).toLocaleString()}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            Stock: {item.total_qty}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        key={`s-${item.id}`}
                        className="w-full text-left px-4 py-2.5 hover:bg-purple-50 border-b last:border-0 flex items-center justify-between gap-3 transition"
                        onClick={() => { addServiceToCart(item); setUnifiedSearchTerm(""); }}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{item.name}</div>
                          <div className="text-[11px] text-gray-400 truncate">{item.description || item.category || "Service"}</div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-xs font-bold text-gray-800">LKR {Number(item.price || 0).toLocaleString()}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Service
                          </span>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>

          {/* Compact Table */}
          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart className="h-10 w-10 text-gray-300 mb-3" />
                <div className="text-sm font-medium">Cart is empty</div>
                <div className="text-xs text-gray-400 mt-1">
                  Click <b>Add Items</b> to add products/services.
                </div>
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 z-10 bg-[#F7F9FC] border-b">
                  <tr className="text-[11px] text-gray-600">
                    <th className="px-2 py-2 text-left w-[42px]">#</th>
                    <th className="px-2 py-2 text-left">Item</th>
                    <th className="px-2 py-2 text-left w-[85px]">Type</th>
                    <th className="px-2 py-2 text-center w-[140px]">Qty</th>
                    <th className="px-2 py-2 text-right w-[120px]">Price</th>
                    <th className="px-2 py-2 text-right w-[150px]">Discount</th>
                    <th className="px-2 py-2 text-right w-[140px]">Total</th>
                    <th className="px-2 py-2 text-center w-[120px]">Status</th>
                    <th className="px-2 py-2 text-right w-[56px]"></th>
                  </tr>
                </thead>

                <tbody>
                  {cart.map((item, index) => {
                    const isService = item.type === "service";
                    const itemTotal =
                      (item.selling_price - (item.applied_discount || 0)) * item.qty;
                    const status = getRequestBadge(item.product_code);

                    return (
                      <tr
                        key={`${item.type}-${item.product_code || item.service_id}`}
                        className="border-b hover:bg-[#FAFBFF] transition"
                      >
                        <td className="px-2 py-2 text-gray-600">{index + 1}</td>

                        <td className="px-2 py-2">
                          <div className="font-semibold text-gray-900 leading-tight">
                            {item.product_name}
                            {!!item.group && (
                              <span className="ml-2 text-[10px] text-blue-700 font-semibold">
                                {item.group}
                              </span>
                            )}
                          </div>
                          {!isService && item.department_id && (
                            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Building className="h-3 w-3" />
                              {departments.find(
                                (d) => String(d.id) === String(item.department_id)
                              )?.department_name || `Dept ${item.department_id}`}
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-2">
                          <Badge
                            variant={isService ? "default" : "outline"}
                            className={`text-[10px] ${
                              isService ? "bg-purple-50 text-purple-700" : ""
                            }`}
                          >
                            {isService ? "Service" : "Product"}
                          </Badge>
                        </td>

                        <td className="px-2 py-2">
                          {isService ? (
                            <div className="text-center font-semibold">1</div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateQty(item.product_code, item.qty - 1)}
                                disabled={item.qty <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <div className="w-8 text-center font-semibold">
                                {item.qty}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => updateQty(item.product_code, item.qty + 1)}
                                disabled={item.qty >= item.available_qty}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-2 text-right font-semibold">
                          LKR {Number(item.selling_price || 0).toLocaleString()}
                        </td>

                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <Input
                              type="number"
                              className="h-7 w-[95px] text-right text-[12px]"
                              value={isService ? item.applied_discount : item.requested_discount}
                              onChange={(e) => {
                                const value = Number(e.target.value) || 0;
                                if (isService) {
                                  updateRequestedDiscount(item.service_id, value, "service");
                                } else {
                                  updateRequestedDiscount(item.product_code, value, "product");
                                }
                              }}
                              disabled={!isService && item.applied_discount > 0}
                              placeholder="0"
                            />

                            {item.requested_discount > 0 ||
                            (isService && item.applied_discount > 0) ? (
                              <Badge variant="outline" className="text-[10px]">
                                {isService ? "Applied" : "Req"}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2"
                                onClick={() =>{
                                  openDiscountRequestModal(item)
                                  toast.info("discount selected after seletect discount request")
                                }}
                              >
                                Request
                              </Button>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-2 text-right">
                          <div className="font-bold text-gray-900">
                            LKR {Number(itemTotal || 0).toLocaleString()}
                          </div>
                          {(item.applied_discount > 0 || item.requested_discount > 0) && (
                            <div className="text-[10px] text-red-600">
                              -LKR{" "}
                              {(
                                (item.applied_discount || item.requested_discount || 0) *
                                item.qty
                              ).toLocaleString()}
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-2 text-center">
                          {status || <span className="text-[10px] text-gray-400">—</span>}
                        </td>

                        <td className="px-2 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                            onClick={() =>
                              removeFromCart(
                                isService ? item.service_id : item.product_code,
                                item.type
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom compact totals */}
          <div className="border-t bg-white px-3 py-2 flex items-center justify-between">
            <div className="text-[11px] text-gray-500">{dateTime}</div>

            <div className="flex items-center gap-6">
              <MiniTotal label="Sub Total" value={totalAmount} />
              <MiniTotal label="Discount" value={totalDiscount} negative />
              <MiniTotal label="Net Total" value={netTotal} bold />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ADD ITEMS POPUP */}

      {/* ✅ keep your existing dialogs as-is (NO CHANGE) */}
      <NewServiceDialog
        isOpen={isServiceDialogOpen}
        onClose={() => setIsServiceDialogOpen(false)}
        newService={newService}
        setNewService={setNewService}
        onSave={addCustomService}
        fetchServices={fetchServices}
      />

      <ServicesManagerDialog
        isOpen={isServicesManagerOpen}
        onClose={() => setIsServicesManagerOpen(false)}
        onServiceAdded={handleServiceAddedFromManager}
      />

      <ReceiptSettingsDialog
        isOpen={activeDialog === "receipt"}
        onClose={() => setActiveDialog(null)}
        invoiceNo={invoiceNo}
        setInvoiceNo={setInvoiceNo}
        dateTime={dateTime}
        userCode={userCode}
        setUserCode={setUserCode}
        autoPrintEnabled={autoPrintEnabled}
        toggleAutoPrint={toggleAutoPrint}
        cart={cart}
        handleManualPrint={handleManualPrint}
        handleDownload80mmPDF={handleDownload80mmPDF}
        generateNewInvoiceNumber={generateNewInvoiceNumber}
      />

      <CustomerDepartmentDialog
        isOpen={activeDialog === "customer"}
        onClose={() => setActiveDialog(null)}
        departments={departments}
        departmentId={departmentId}
        setDepartmentId={setDepartmentId}
        customerType={customerType}
        setCustomerType={setCustomerType}
        customers={customers}
        selectedCustomer={selectedCustomer}
        customerSearchTerm={customerSearchTerm}
        setCustomerSearchTerm={setCustomerSearchTerm}
        filteredCustomers={filteredCustomers}
        showCustomerSuggestions={showCustomerSuggestions}
        setShowCustomerSuggestions={setShowCustomerSuggestions}
        handleCustomerSelect={handleCustomerSelect}
        clearSelectedCustomer={clearSelectedCustomer}
        selectedCustomerDetails={selectedCustomerDetails}
        availableCredit={availableCredit}
        setIsCustomerDialogOpen={setIsCustomerDialogOpen}
        currentUser={currentUser}
        isDepartmentLocked={isDepartmentLocked}
      />

      <PaymentDetailsDialog
        isOpen={activeDialog === "payment"}
        onClose={() => setActiveDialog(null)}
        invoiceType={invoiceType}
        serviceDescription={serviceDescription}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        selectedCustomerDetails={selectedCustomerDetails}
        availableCredit={availableCredit}
        netTotal={netTotal}
        cardSurcharge={cardSurcharge}
        effectiveNetTotal={effectiveNetTotal}
        creditAllocated={creditAllocated}
        cashPaymentAmount={cashPaymentAmount}
        canUseCredit={canUseCredit}
        customerType={customerType}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        note={note}
        setNote={setNote}
        totalAmount={totalAmount}
        totalDiscount={totalDiscount}
        balance={balance}
        isBalanceChange={isBalanceChange}
        saveDraftLocal={saveDraftLocal}
        cart={cart}
        setCart={setCart}
        handleCreateInvoice={handleCreateInvoice}
        autoPrintEnabled={autoPrintEnabled}
        printThermalReceipt={printThermalReceipt}
        departments={departments}
        departmentId={departmentId}
        selectedCustomer={selectedCustomer}
        isDepartmentLocked={isDepartmentLocked}
      />

      <NewCustomerDialog
        isCustomerDialogOpen={isCustomerDialogOpen}
        setIsCustomerDialogOpen={setIsCustomerDialogOpen}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        createCustomer={createCustomer}
        currentUser={currentUser}
        departments={departments}
        departmentId={departmentId}
        isDepartmentLocked={isDepartmentLocked}
      />

      <DraftsDialog
        isDraftsOpen={isDraftsOpen}
        setIsDraftsOpen={setIsDraftsOpen}
        drafts={drafts}
        applyDraft={applyDraft}
        removeDraft={removeDraft}
      />
    </div>
  </div>
);

}
