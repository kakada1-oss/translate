export interface OrderItem {
    id: string; // generated ID
    orderNumber: string;
    orderTime: string;
    status: string;
    shopName: string;
    productName: string;
    productLink: string;
    model: string;
    quantity: string;
    amount: string;
    actualPayment: string;
    freight: string;
    logisticsCompany: string;
    logisticsNumber: string;
    // Translated fields
    shopNameTranslated?: string;
    productNameTranslated?: string;
    modelTranslated?: string;
    logisticsCompanyTranslated?: string;
    statusTranslated?: string;
    productNameShortened?: string;
    category?: string;
    subcategory?: string;
    // Extracted attributes (Pass 2)
    attrSize?: string;
    attrColor?: string;
    attrMaterial?: string;
    attrGender?: string;
    attrAgeGroup?: string;
    attrBrand?: string;
    attrOther?: string;
}

export type ParseResult = {
    data: OrderItem[];
    errors: string[];
};
