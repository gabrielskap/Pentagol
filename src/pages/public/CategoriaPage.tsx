import React from 'react';
import { useParams } from 'react-router-dom';
import { ProductListing } from '../../components/public/ProductListing';

export const CategoriaPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return <ProductListing categorySlug={slug} />;
};
