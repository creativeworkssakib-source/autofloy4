import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ProductType = "physical" | "digital";

interface ProductTypeContextType {
  productType: ProductType;
  setProductType: (type: ProductType) => void;
  isDigitalMode: boolean;
}

const ProductTypeContext = createContext<ProductTypeContextType | undefined>(undefined);

export const ProductTypeProvider = ({ children }: { children: ReactNode }) => {
  const [productType, setProductType] = useState<ProductType>(() => {
    const saved = localStorage.getItem("autofloy_product_type");
    return (saved as ProductType) || "physical";
  });

  useEffect(() => {
    localStorage.setItem("autofloy_product_type", productType);
  }, [productType]);

  const isDigitalMode = productType === "digital";

  return (
    <ProductTypeContext.Provider value={{ productType, setProductType, isDigitalMode }}>
      {children}
    </ProductTypeContext.Provider>
  );
};

export const useProductType = () => {
  const context = useContext(ProductTypeContext);
  if (!context) {
    throw new Error("useProductType must be used within a ProductTypeProvider");
  }
  return context;
};
