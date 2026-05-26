import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import './featuredProducts.css';

const FeaturedProducts = () => {
    const products = useSelector((state) => state.products.products);
    {console.log("products",products)}

    return (
        <div className='w-full min-h-screen py-40 bg-gradient-to-br from-[#4779a4] to-[#f7e7ce] text-center px-4 md:px-10'>
            <div className='text-center mb-10'>
                <h2 className='text-4xl text-white capitalize tracking-widest mb-3 font-bold leading-none'>
                    Diseños Disponibles
                </h2>
                <div className='w-24 h-1 bg-white mx-auto opacity-70'></div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 my-16 mx-auto max-w-[1400px]'>
                {products.slice(0, 3).map((product, index) => (
                    <div key={product.id} className="relative group w-full">
                        <div className='relative rounded-md p-6 backdrop-blur-md bg-white/20 border border-white/30 shadow-lg transition-all duration-300 hover:shadow-xl hover:backdrop-blur-xl'>
                            <Link to={`/products/${product.id}`} className='absolute inset-0 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-70 transition-all duration-300'>
                                <span className='flex items-center justify-center bg-[#f7e7ce] w-12 h-12 rounded-full shadow-lg'>
                                    <FaSearch className='text-[#2c3e50]' />
                                </span>
                            </Link>
                            <img 
    className='w-full h-[225px] object-contain rounded-md transition-transform duration-300 transform group-hover:scale-105' 
    src={product.images?.data ? `data:${product.images.contentType};base64,${product.images.data}` : 'ruta/default.jpg'} 
    alt={product.name} 
    style={{ animationDelay: `${index * 0.2}s` }} 
/>

                        </div>
                        <footer className='flex mt-4 justify-between items-center px-4'>
                            <h4 className='mb-0 text-[#2c3e50] font-semibold'>{product.name}</h4>
                            <p className='mb-0 font-semibold italic text-[#4779a4] tracking-widest'>
                                {product.price ? `$${Number(product.price).toLocaleString('es-AR')}` : ''}
                            </p>
                        </footer>
                    </div>
                ))}
            </div>
            <Link 
                className='inline-block uppercase text-center px-6 py-3 mt-4 bg-[#f7e7ce]/80 text-[#2c3e50] font-semibold shadow-lg rounded hover:bg-[#f7e7ce] transition-all duration-300 backdrop-blur-md' 
                to='/products'
            >
                todos los diseños
            </Link>
        </div>
    );
};

export default FeaturedProducts;
