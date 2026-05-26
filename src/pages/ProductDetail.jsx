import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHero from '../layout/PageHero';
import { getProductDetails } from '../store/actions/products-actions';
import TheSpinner from '../layout/TheSpinner';
//import Modal from './ModalLogin.jsx';

const containerVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: { duration: .3 }
    },
    exit: {
        x: '-100vw',
        transition: { ease: 'easeInOut' }
    }
}

const ProductDetail = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.ui.productDetailLoading);
    //const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        dispatch(getProductDetails(productId));
    }, [dispatch, productId]);

    const product = useSelector((state) => state.products.productDetails);
    const {
        name,
        description,
        price,
        //  brand,
        // sku,
        image,
    } = product;

    const handleBuyClick = async () => {
        try {
            //const user = JSON.parse(localStorage.getItem('user'));
            //   const userId = JSON.parse(localStorage.getItem('id'));
            //    if (!user) {
            //    console.error('No se pudo encontrar el correo electrónico del usuario en el localStorage');
            //      setShowModal(true); // Mostrar el modal si el usuario no está logueado
            //  return;
            // }

            //  if (!userId) {
            //    setShowModal(true); // Mostrar el modal si el userId no está disponible
            //  return;
            //}

            // Convertir el precio a un número
            const numericPrice = parseFloat(price);

            const response = await fetch(`https://restapi-lennitabb-production.up.railway.app/api/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: [{
                        name: name,
                        price: numericPrice, // Usar el precio numérico
                        quantity: 1
                    }],
                    // payer: {
                    //   email: user
                    // }
                })
            });
            console.log(response);
            const data = await response.json();
            // console.log(data); // Aquí puedes manejar la respuesta de la API

            // Verificar si la respuesta contiene la propiedad redirectUrl
            if (data.redirectUrl) {
                // Verificar si es un dispositivo móvil
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                    // Redireccionar al usuario a la URL directamente si está en un dispositivo móvil
                    window.location.href = data.redirectUrl;
                } else {
                    // Abrir una nueva pestaña con la URL proporcionada si está en una computadora
                    window.open(data.redirectUrl, '_blank');
                }
            }
        } catch (error) {
            console.error('Error al realizar la compra:', error);
        }
    };

    return (
        <motion.div className='mb-48'
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <PageHero title={name} product />
            <div className='mt-16 space-y-16 w-full px-4 md:px-8 lg:px-0 mx-auto max-w-screen-xl'>
                <Link to='/products' className='uppercase bg-purple-500 px-4 py-2 rounded text-white font-semibold shadow-lg'>
                    back to products
                </Link>
                {loading ? <TheSpinner /> :
                    <div className='flex'>
                        <div className='w-1/2 pr-8'>
                            <img
                                src={product.images?.data ? `data:${product.images.contentType};base64,${product.images.data}` : 'ruta/default.jpg'}
                                alt={product.name}

                                className="w-full rounded-lg md:max-w-[200px] lg:max-w-[200px]"
                            />
                        </div>




                        <div className='w-1/2'>
                            <h2 className='font-bold text-5xl  text-[#9F5D23] tracking-wide mb-5'>{name}</h2>
                            <h4 className='text-xl font-extrabold text-purple-500 tracking-widest italic my-4'>
                                {product && product.price ? `$${Number(product.price).toLocaleString('es-AR')}` : ''}
                            </h4>


                            <p className='max-w-3xl tracking-wider leading-8 text-gray-500 mb-6'>{description}</p>
                            <div className='flex flex-col w-full sm:w-3/4 lg:w-1/2 space-y-5'>
                                <div className='flex justify-between'>
                                    <p className='text-lg font-semibold tracking-wider text-gray-600'>Disponible :</p>
                                    <p>En stock</p>
                                </div>
                            </div>
                            <hr className='my-6' />
                            <button className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg font-semibold" onClick={handleBuyClick}>
                                Comprar
                            </button>
                        </div>
                    </div>
                }
            </div>
            {/*showModal && <Modal message="Usted no está logueado! Ingrese sesión o regístrese!" closeModal={() => setShowModal(false)} />*/}
        </motion.div>
    );
};

export default ProductDetail;
