import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "../i18n";

import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";

function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", price: "", image: "", description: "", rating: "" });
  const [addErrors, setAddErrors] = useState({});

  // FETCH PRODUCTS (Supports dynamic REST API with internal JSON seed fallback)
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/products`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        } else {
          // Internal JSON seed fallback
          return fetch("/data/seed_products.json").then(r => r.json()).then(data => setProducts(data));
        }
      })
      .catch(async () => {
        try {
          // Read from internal JSON seed file
          const seedRes = await fetch("/data/seed_products.json");
          const seedData = await seedRes.json();
          setProducts(seedData);
        } catch (e) {
          setError(t("products.error"));
        }
      })
      .finally(() => setLoading(false));
  }, [t]);

  // DELETE PRODUCT
  const deleteProduct = async (id) => {
    const password = prompt("Enter admin password to delete:");
    if (!password) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`, {
        headers: { "x-admin-password": password }
      });
      setProducts(products.filter((item) => item.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || "Unauthorized"));
    }
  };

  // ADD PRODUCT WITH VALIDATION
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddErrors({});

    const errors = {};
    if (!newProduct.name || newProduct.name.trim().length < 2) {
      errors.name = "Product name must be at least 2 characters.";
    }
    if (!newProduct.category) {
      errors.category = "Please select a category.";
    }
    if (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) <= 0) {
      errors.price = "Please enter a valid positive price.";
    }

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/products`, newProduct);
      setProducts([...products, res.data]);
      setNewProduct({ name: "", category: "", price: "", image: "", description: "", rating: "" });
      setShowAddForm(false);
      alert("Product added successfully!");
    } catch (err) {
      alert("Failed to add product: " + (err.response?.data?.error || err.message));
    }
  };

  // DYNAMIC CATEGORIES EXTRACTION
  const availableCategories = Array.from(
    new Set(products.map((item) => item.category).filter(Boolean))
  );

  // FILTERING
  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selected === "all" ||
      (item.category && item.category.trim().toLowerCase() === selected.trim().toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* TITLE */}
      <h1 className="text-3xl font-black mb-6 text-green-700 dark:text-green-400">
        {t("products.title")}
      </h1>

      {/* SEARCH + FILTER */}
      <SearchBar search={search} setSearch={setSearch} />
      <CategoryFilter selected={selected} setSelected={setSelected} categories={availableCategories} />

      {/* ADD NEW PRODUCT FORM */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700"
      >
        {showAddForm ? "Hide Form" : "Add New Product"}
      </button>

      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-6 border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct} noValidate className="grid md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => {
                  setNewProduct({...newProduct, name: e.target.value});
                  if (addErrors.name) setAddErrors({...addErrors, name: ""});
                }}
                className={`w-full bg-gray-50 dark:bg-gray-900 border rounded p-2 text-gray-800 dark:text-white ${addErrors.name ? 'border-red-500' : 'dark:border-gray-700'}`}
              />
              {addErrors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{addErrors.name}</p>}
            </div>

            <div>
              <select
                value={newProduct.category}
                onChange={(e) => {
                  setNewProduct({...newProduct, category: e.target.value});
                  if (addErrors.category) setAddErrors({...addErrors, category: ""});
                }}
                className={`w-full bg-gray-50 dark:bg-gray-900 border rounded p-2 text-gray-800 dark:text-white ${addErrors.category ? 'border-red-500' : 'dark:border-gray-700'}`}
              >
                <option value="">Select Category</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Herbs">Herbs</option>
                <option value="Seeds">Seeds</option>
              </select>
              {addErrors.category && <p className="text-red-500 text-xs mt-1 font-semibold">{addErrors.category}</p>}
            </div>

            <div>
              <input
                type="number"
                placeholder="Price"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => {
                  setNewProduct({...newProduct, price: e.target.value});
                  if (addErrors.price) setAddErrors({...addErrors, price: ""});
                }}
                className={`w-full bg-gray-50 dark:bg-gray-900 border rounded p-2 text-gray-800 dark:text-white ${addErrors.price ? 'border-red-500' : 'dark:border-gray-700'}`}
              />
              {addErrors.price && <p className="text-red-500 text-xs mt-1 font-semibold">{addErrors.price}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Image URL"
                value={newProduct.image}
                onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
              />
            </div>

            <textarea
              placeholder="Description"
              rows="2"
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              className="md:col-span-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />

            <input
              type="number"
              placeholder="Rating (0-5)"
              step="0.1"
              min="0"
              max="5"
              value={newProduct.rating}
              onChange={(e) => setNewProduct({...newProduct, rating: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded p-2 text-gray-800 dark:text-white"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition">
                Add Product
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded font-bold transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-center mt-10 text-gray-500 dark:text-gray-300">
          <div className="animate-pulse">{t("products.loading")}</div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p className="text-red-500 mt-6 text-center font-semibold">
          {error}
        </p>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center mt-10 text-gray-500 dark:text-gray-400 font-semibold">
          {t("products.empty")}
        </div>
      )}

      {/* PRODUCT GRID */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">

        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            deleteProduct={deleteProduct}
          />
        ))}

      </div>

    </div>
  );
}

export default Products;