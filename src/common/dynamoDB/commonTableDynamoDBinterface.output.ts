export interface AllCategoriesCache {
    data: {
        date: Date;
        result: CategoryItemCache [];
    } 
}

export interface CategoryItemCache {
    id: string,
    name: string,
    totalResults: number,
    icon: string
};
export interface DictionaryItem {
    key: string,
    words: string[]
};