import { useState, useEffect } from 'react';
import { Article, Section, RecentActivity, InventoryState, Invoice, Quote, Customer, InvoiceItem } from '@/types/inventory';

const STORAGE_KEY = 'inventory_data';

export const useInventory = () => {
  const [state, setState] = useState<InventoryState>({
    articles: [],
    sections: [],
    recentActivities: [],
    invoices: [],
    quotes: [],
    customers: [],
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setState(parsed);
      } catch (error) {
        console.error('Error loading inventory data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addRecentActivity = (activity: Omit<RecentActivity, 'id' | 'timestamp'>) => {
    const newActivity: RecentActivity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      recentActivities: [newActivity, ...prev.recentActivities.slice(0, 49)], // Keep only last 50
    }));
  };

  const addArticle = (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      articles: [...prev.articles, newArticle],
    }));

    addRecentActivity({
      articleCode: newArticle.code,
      articleName: newArticle.name,
      action: 'created',
      details: `Agregado a ${articleData.sectionId ? 'sección específica' : 'inventario general'}`,
    });

    return newArticle;
  };

  const updateArticle = (articleId: string, updates: Partial<Article>) => {
    setState(prev => ({
      ...prev,
      articles: prev.articles.map(article =>
        article.id === articleId
          ? { ...article, ...updates, updatedAt: new Date().toISOString() }
          : article
      ),
    }));

    const article = state.articles.find(a => a.id === articleId);
    if (article) {
      addRecentActivity({
        articleCode: article.code,
        articleName: article.name,
        action: 'updated',
        details: 'Información actualizada',
      });
    }
  };

  const deleteArticle = (articleId: string) => {
    const article = state.articles.find(a => a.id === articleId);
    
    setState(prev => ({
      ...prev,
      articles: prev.articles.filter(a => a.id !== articleId),
    }));

    if (article) {
      addRecentActivity({
        articleCode: article.code,
        articleName: article.name,
        action: 'deleted',
        details: 'Artículo eliminado',
      });
    }
  };

  const addSection = (sectionData: Omit<Section, 'id' | 'createdAt' | 'articles'>) => {
    const newSection: Section = {
      ...sectionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      articles: [],
    };

    setState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));

    return newSection;
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  };

  const deleteSection = (sectionId: string) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
      articles: prev.articles.map(article =>
        article.sectionId === sectionId
          ? { ...article, sectionId: undefined }
          : article
      ),
    }));
  };

  const bulkAddArticles = (articlesData: string) => {
    const lines = articlesData.trim().split('\n');
    const addedArticles: Article[] = [];
    const updatedArticles: Article[] = [];

    lines.forEach(line => {
      const parts = line.split(/\t|,/).map(part => part.trim());
      if (parts.length >= 5) {
        const [code, name, brand, unitsStr, priceStr, reference = ''] = parts;
        const units = parseInt(unitsStr) || 0;
        const price = parseFloat(priceStr) || 0;

        // Check if article exists
        const existingArticle = state.articles.find(a => a.code === code);
        
        if (existingArticle) {
          updateArticle(existingArticle.id, {
            name,
            brand,
            units,
            price,
            reference,
          });
          updatedArticles.push(existingArticle);
        } else {
          const newArticle = addArticle({
            code,
            name,
            brand,
            units,
            price,
            reference,
          });
          addedArticles.push(newArticle);
        }
      }
    });

    return { addedArticles, updatedArticles };
  };

  const searchArticles = (query: string, sectionId?: string) => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ');
    let articlesToSearch = state.articles;

    if (sectionId) {
      articlesToSearch = state.articles.filter(a => a.sectionId === sectionId);
    }

    return articlesToSearch.filter(article => {
      const searchableText = `${article.code} ${article.name} ${article.brand} ${article.reference}`.toLowerCase();
      
      return searchTerms.every(term => {
        // Exact match
        if (searchableText.includes(term)) return true;
        
        // Abbreviation matching (e.g., "cb" matches "cable")
        const words = searchableText.split(' ');
        return words.some(word => {
          if (word.startsWith(term)) return true;
          // Check if term could be an abbreviation
          if (term.length <= 3) {
            const wordAbbrev = word.split('').slice(0, term.length).join('');
            return wordAbbrev === term;
          }
          return false;
        });
      });
    });
  };

  // Customer management
  const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
    };

    setState(prev => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
    }));

    return newCustomer;
  };

  // Invoice management
  const createInvoice = (customer: Customer, items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.19; // 19% IVA Colombia
    const total = subtotal + iva;

    const invoiceNumber = `FAC-${String(state.invoices.length + 1).padStart(6, '0')}`;

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      customer,
      items,
      subtotal,
      iva,
      total,
      status: 'draft',
      createdAt: new Date().toISOString(),
      resolucionDian: 'Resolución DIAN 18764001234567',
    };

    setState(prev => ({
      ...prev,
      invoices: [...prev.invoices, newInvoice],
    }));

    return newInvoice;
  };

  const confirmInvoice = (invoiceId: string) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.map(invoice => {
        if (invoice.id === invoiceId && invoice.status === 'draft') {
          // Deduct items from inventory
          invoice.items.forEach(item => {
            const article = prev.articles.find(a => a.id === item.articleId);
            if (article) {
              updateArticle(article.id, {
                units: Math.max(0, article.units - item.quantity),
              });
            }
          });

          return {
            ...invoice,
            status: 'confirmed' as const,
            confirmedAt: new Date().toISOString(),
          };
        }
        return invoice;
      }),
    }));
  };

  const cancelInvoice = (invoiceId: string) => {
    setState(prev => ({
      ...prev,
      invoices: prev.invoices.map(invoice =>
        invoice.id === invoiceId
          ? { ...invoice, status: 'cancelled' as const }
          : invoice
      ),
    }));
  };

  // Quote management
  const createQuote = (customer: Customer, items: InvoiceItem[], validDays: number = 15) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const quoteNumber = `COT-${String(state.quotes.length + 1).padStart(6, '0')}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const newQuote: Quote = {
      id: Date.now().toString(),
      quoteNumber,
      customer,
      items,
      subtotal,
      iva,
      total,
      status: 'active',
      validUntil: validUntil.toISOString(),
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      quotes: [...prev.quotes, newQuote],
    }));

    return newQuote;
  };

  const convertQuoteToInvoice = (quoteId: string) => {
    const quote = state.quotes.find(q => q.id === quoteId);
    if (!quote || quote.status !== 'active') return null;

    const newInvoice = createInvoice(quote.customer, quote.items);

    setState(prev => ({
      ...prev,
      quotes: prev.quotes.map(q =>
        q.id === quoteId
          ? { ...q, status: 'converted' as const, convertedToInvoiceId: newInvoice.id }
          : q
      ),
    }));

    return newInvoice;
  };

  return {
    ...state,
    addArticle,
    updateArticle,
    deleteArticle,
    addSection,
    updateSection,
    deleteSection,
    bulkAddArticles,
    searchArticles,
    addCustomer,
    createInvoice,
    confirmInvoice,
    cancelInvoice,
    createQuote,
    convertQuoteToInvoice,
  };
};