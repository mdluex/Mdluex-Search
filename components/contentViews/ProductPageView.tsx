import React from 'react';
import { ProductPageContent, SearchResultItemData } from '../../types';
import { getTextDirection } from '../../utils/languageUtils';

interface ProductPageViewProps {
  content: ProductPageContent;
  searchItem: SearchResultItemData;
  effectiveTheme: 'light' | 'dark';
}

const ProductPageView: React.FC<ProductPageViewProps> = ({ content, searchItem, effectiveTheme }) => {
  const headerBgColor = effectiveTheme === 'dark' ? 'bg-neutral-700/30' : 'bg-gray-100';
  // Adjusted light theme text colors for better contrast
  const textColor = effectiveTheme === 'dark' ? 'text-neutral-100' : 'text-black';
  const subTextColor = effectiveTheme === 'dark' ? 'text-neutral-300' : 'text-neutral-700';
  const bodyTextColor = effectiveTheme === 'dark' ? 'text-neutral-300' : 'text-neutral-600';
  const sectionHeadingColor = effectiveTheme === 'dark' ? 'text-neutral-200' : 'text-neutral-800';
  const borderColor = effectiveTheme === 'dark' ? 'border-neutral-700' : 'border-gray-200';
  const buttonBg = effectiveTheme === 'dark' ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-gray-800 hover:bg-gray-700';
  const buttonText = effectiveTheme === 'dark' ? 'text-neutral-100' : 'text-white';

  // Detect text direction for content
  const productNameDirection = getTextDirection(content.productName);
  const taglineDirection = getTextDirection(content.tagline);
  const descriptionDirection = getTextDirection(content.description);
  const featuresDirection = content.features.some(f => getTextDirection(f) === 'rtl') ? 'rtl' : 'ltr';

  return (
    <div>
        {/* Custom Header for Product Page */}
        <header className={`mb-8 pb-4 border-b ${borderColor} ${headerBgColor} p-4 rounded-t-lg -m-4 sm:-m-6 md:-m-8 mb-8`}> {/* Full width banner-like header */}
            <div className="flex items-center mb-1">
                <img 
                    src={`https://www.google.com/s2/favicons?domain=${searchItem.domain}&sz=40`} 
                    alt="" 
                    className="w-8 h-8 mr-3 rounded-md object-contain shadow"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div>
                    {/* Site name in header uses textColor - this should be fine based on screenshot of header */}
                    <h1 className={`text-3xl font-bold ${effectiveTheme === 'dark' ? 'text-neutral-100' : 'text-gray-900'}`}>{searchItem.name}</h1>
                    <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`}>{searchItem.domain}</p>
                </div>
            </div>
            {searchItem.originalQuery && (
                <p className={`mt-2 text-xs ${effectiveTheme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Search context: "{searchItem.originalQuery}"
                </p>
            )}
        </header>

        {/* Product Page Content */}
        <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
                <img 
                src={content.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(content.productName)}/600/400`} 
                alt={content.productName} 
                className={`w-full h-auto object-cover rounded-lg shadow-lg border ${borderColor}`}
                />
            </div>
            <div className="md:w-1/2">
                <h1 className={`text-3xl font-bold ${textColor} mb-2`} dir={productNameDirection}>{content.productName}</h1>
                <p className={`text-lg ${subTextColor} mb-4`} dir={taglineDirection}>{content.tagline}</p>
                
                <div className="mb-6">
                <h2 className={`text-xl font-semibold ${sectionHeadingColor} mb-2`}>Key Features:</h2>
                <ul className={`list-disc list-inside space-y-1 ${bodyTextColor}`} dir={featuresDirection}>
                    {content.features.map((feature, index) => (
                    <li key={index} dir={getTextDirection(feature)}>{feature}</li>
                    ))}
                </ul>
                </div>

                <div className="mb-6">
                <h2 className={`text-xl font-semibold ${sectionHeadingColor} mb-2`}>Product Description:</h2>
                <p className={`${bodyTextColor} leading-relaxed`} dir={descriptionDirection}>{content.description}</p>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                <p className={`text-3xl font-bold ${textColor}`}>{content.price}</p>
                </div>
                
                <button className={`w-full ${buttonBg} ${buttonText} font-bold py-3 px-6 rounded-lg transition-colors text-lg`} dir={getTextDirection(content.callToAction)}>
                {content.callToAction}
                </button>
                <p className={`mt-4 text-xs ${effectiveTheme === 'dark' ? 'text-neutral-500' : 'text-gray-500'} italic`}>
                    This is a fictional product page from {content.websiteName}. Prices and products are not real.
                </p>
            </div>
        </div>
    </div>
  );
};

export default ProductPageView;
