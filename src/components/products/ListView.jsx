import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/helpers";
import { HiChevronDoubleRight } from "react-icons/hi";
import { FaTrash, FaEdit } from "react-icons/fa";
import TheSpinner from "../../layout/TheSpinner";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct } from "../../store/actions/products-actions";

const ListView = () => {
  const dispatch = useDispatch();
  const { filteredProducts } = useSelector((state) => state.products);

  // Estado para manejar loading por cada ID individual
  const [loadingMap, setLoadingMap] = useState({});

  const handleDelete = async (id) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [id]: true }));
      const response = await fetch(
        `https://dimgrey-gnu-703361.hostingersite.com/index.php?recurso=designs&id=${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el diseño");
      }

      dispatch(deleteProduct(id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="relative">
      {filteredProducts.map((product) => {
        const { id, name, description, price, images } = product;
        const isLoading = loadingMap[id];

        return (
          <div key={id} className="flex mb-8 relative p-2 border rounded-md shadow-sm">
            {/* Botones de eliminar y editar */}
            <div className="absolute top-2 right-2 flex gap-2">
              <Link
                to={`/edit/${id}`}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-700 transition"
              >
                <FaEdit />
              </Link>
              <button
                onClick={() => handleDelete(id)}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-700 transition"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaTrash />
                )}
              </button>
            </div>

            <img
              className="w-[300px] h-[200px] object-contain mb-4 rounded"
              src={
                images?.data
                  ? `data:${images.contentType};base64,${images.data}`
                  : "ruta/default.jpg"
              }
              alt={name}
            />
            <div className="flex flex-col flex-grow ml-4">
              <h3 className="mb-2 text-lg font-bold tracking-widest">{name}</h3>
              <h4 className="mb-2 text-[#4779a4] italic font-bold">{formatPrice(price)}</h4>
              {description && (
                <p className="max-w-2xl mb-3 text-gray-500">
                  {description.substring(0, 150)}...
                </p>
              )}
              <div className="flex items-center">
                <Link
                  to={`/products/${id}`}
                  className="text-sm uppercase bg-gradient-to-br from-[#4779a4] to-[#f7e7ce] text-white rounded-md font-bold py-1 px-2 shadow-lg"
                >
                  Detalles
                  <span className="inline-block ml-1">
                    <HiChevronDoubleRight />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
