// services-utils.js

const SERVICES_STORAGE_KEY = "invoice_services_v1";

export const DEFAULT_SERVICES = [
  {
    id: 1,
    name: "Wheel Alignment",
    price: 2500,
    type: "service",
    description: "Full wheel alignment service",
    category: "alignment",
  },
  {
    id: 2,
    name: "Wheel Balancing",
    price: 1500,
    type: "service",
    description: "Wheel balancing for all wheels",
    category: "balancing",
  },
  // ... other default services
];

// Load services from localStorage
export const loadServices = () => {
  try {
    const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (storedServices) {
      return JSON.parse(storedServices);
    } else {
      // Initialize with default services
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
      return DEFAULT_SERVICES;
    }
  } catch (error) {
    console.error("Error loading services:", error);
    return DEFAULT_SERVICES;
  }
};

// Save services to localStorage
export const saveServices = (services) => {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    return true;
  } catch (error) {
    console.error("Error saving services:", error);
    return false;
  }
};

// Add a new service
export const addService = (service) => {
  const services = loadServices();
  const newId = Math.max(...services.map(s => s.id), 0) + 1;
  const newService = {
    ...service,
    id: newId,
    type: "service",
  };
  const updatedServices = [...services, newService];
  saveServices(updatedServices);
  return newService;
};

// Update a service
export const updateService = (id, updates) => {
  const services = loadServices();
  const updatedServices = services.map(service => 
    service.id === id ? { ...service, ...updates } : service
  );
  saveServices(updatedServices);
  return updatedServices.find(s => s.id === id);
};

// Delete a service
export const deleteService = (id) => {
  const services = loadServices();
  const updatedServices = services.filter(service => service.id !== id);
  saveServices(updatedServices);
  return true;
};

// Search services
export const searchServices = (term) => {
  const services = loadServices();
  if (!term.trim()) return services;
  
  const searchTerm = term.toLowerCase();
  return services.filter(service => 
    service.name.toLowerCase().includes(searchTerm) ||
    service.description.toLowerCase().includes(searchTerm) ||
    service.category?.toLowerCase().includes(searchTerm)
  );
};

// Get service categories
export const getCategories = () => {
  const services = loadServices();
  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];
  return categories.sort();
};