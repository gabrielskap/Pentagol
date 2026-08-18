import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductListing } from '../../components/public/ProductListing';

export const BuscaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  return <ProductListing searchQueryProp={q} />;
};
