import React, { useState } from "react";

const LaptopsShowcase = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

 const products = [
  {
    id: "lap-001",
    name: "Apple MacBook Air M2",
    specs: '13.6" Liquid Retina, M2, 16GB, 256GB SSD',
    price: "₹72,990",
    imageUrl: "https://techcrunch.com/wp-content/uploads/2022/07/CMC_1580.jpg",
    url:"https://www.myg.in/laptop-desktops/apple/apple-macbook-air-m2-16-gb-256-gb-ssd-space-grey-space-grey/"
  },
  {
    id: "lap-003",
    name: "Dell XPS 13 9340",
    specs: '13.4" FHD+, Intel Core Ultra 7, 16GB, 512GB SSD',
    price: "₹1,68,990",
    imageUrl: "https://laptopmedia.com/wp-content/uploads/2024/04/5-15.jpg",
    url:"https://www.myg.in/laptop-desktops/dell/dell-dc-15250-thin-and-light-laptop-intel-core-i7-13th-gen-16gb-512gb-ssd-platinum-silver-odc1525000601rins1/"
  },
  {
    id: "lap-005",
    name: "Lenovo Legion 5",
    specs: '15.3" 120Hz, Ryzen 7, RTX 5050, 16GB RAM',
    price: "₹1,88,990",
    imageUrl: "https://i.pcmag.com/imagery/reviews/032Ghc5tCjiCya7cxiW3B5O-11.fit_scale.size_400x225.v1623952890.jpg",
    url:"https://www.myg.in/laptop-desktops/lenovo/lenovo-legion-pro-5-gaming-laptop-intel-core-ultra-7-255hx-32-gb-1-tb-ssd-windows-11-home-16-inch-eclipse-black-83f3007cin/"
  },
  {
    id: "lap-006",
    name: "ASUS ROG Zephyrus G14",
    specs: '14" 3K OLED 120Hz, Ryzen 9, RTX 4060, 16GB RAM',
    price: "₹1,76,990",
    imageUrl: "https://www.cnet.com/a/img/resize/33edf0812bed3890a8ef1d9e69947c6ba2b8be70/hub/2024/02/05/e716f8f8-a7a4-418c-9b14-0b210d9dfc72/asus-rog-zephyrus-g14-2024-5409.jpg?auto=webp&fit=crop&height=900&width=1200",
    url:"https://www.myg.in/laptop-desktops/asus/asus-rog-zephyrus-g14-gaming-laptop-oled-amd-ryzen-9-octa-core-8945hs-16-gb-1-tb-ssd-nvidia-geforce-rtx-4060-eclipse-gray-ga403uv-qs085ws/"
  },
  {
    id: "lap-009",
    name: "Lenovo LOQ AI",
    specs: '14" AI Performance, Core Ultra 5, 16GB RAM, 512GB SSD',
    price: "₹79,990",
    imageUrl: "https://p3-ofp.static.pub//fes/cms/2023/06/19/4a29tjbf02npxpyll9ftj0k6dnw6so241163.jpg",
    url:"https://www.myg.in/laptop-desktops/lenovo/lenovo-loq-ai-gaming-laptop-amd-ryzen-5-7235hs-16gb-512gb-ssd-nvidia-rtx-3050a-4gb-grey-83jc00lsin/"
  },
];
  if (!products || products.length === 0) return null;

  return (
    <>
      <div
        className="w-full px-0 py-2 show-case"
        style={{ width: "100vw", marginLeft: "-40px" }}
      >
        <h2 className="text-2xl font-semibold text-white mb-6 px-20">
          Check out these options
        </h2>

        <div className="flex gap-6 overflow-x-auto pb-4 px-6 no-scrollbar">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="min-w-[280px] bg-black/70 rounded-2xl shadow-xl p-4 flex flex-col transition cursor-pointer hover:scale-105 hover:shadow-[0_0_25px_rgba(255,140,0,0.6)]"
            >
              <div className="flex items-center justify-center mb-4 h-[160px]">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>

              <h3 className="text-lg text-orange-500 font-semibold mb-2">
                {product.name}
              </h3>

              <p className="text-sm text-white mb-3">{product.specs}</p>

              <div className="mt-auto text-xl font-bold text-orange-600">
                {product.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 PREMIUM MODAL */}
      {selectedProduct && (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-100 animate-fadeIn"
    onClick={() => setSelectedProduct(null)}
  >
    <div
      className="relative w-[95vw] max-w-6xl bg-gradient-to-br from-black/80 to-gray-900/80 
      border border-orange-500/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(255,140,0,0.3)] 
      animate-scaleIn overflow-y-auto max-h-[90vh]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close Button */}
      <button
        onClick={() => setSelectedProduct(null)}
        className="absolute top-5 right-5 text-white text-2xl hover:text-orange-500 transition"
      >
        ✕
      </button>

      {/* Product Header */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Carousel */}
        <div className="md:w-1/2 flex flex-col items-center gap-4">
          <img
            src={selectedProduct.imageUrl}
            alt={selectedProduct.name}
            className="max-h-[300px] object-contain rounded-xl drop-shadow-[0_0_20px_rgba(255,140,0,0.5)]"
          />
          <div className="flex gap-2">
            {/* Additional dummy thumbnails */}
            {[1, 2, 3].map((i) => (
              <img
                key={i}
                src={selectedProduct.imageUrl}
                alt={`Thumbnail ${i}`}
                className="w-16 h-16 object-contain rounded-lg border border-orange-500/30 cursor-pointer hover:scale-105 transition"
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <h3 className="text-3xl font-bold text-orange-500">{selectedProduct.name}</h3>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-orange-600">{selectedProduct.price}</span>
            <span className="text-yellow-400 font-semibold">★★★★☆</span>
            <span className="text-gray-300">(1200 ratings)</span>
          </div>

          {/* Key Highlights */}
          <div className="bg-gray-800/40 p-4 rounded-xl">
            <h4 className="text-xl font-semibold text-orange-500 mb-2">Key Highlights</h4>
            <ul className="list-disc list-inside text-white text-sm">
              <li>High-performance processor for fast computing</li>
              <li>Long-lasting battery with fast charging</li>
              <li>High-resolution display with vivid colors</li>
              <li>Lightweight design, ideal for travel</li>
              <li>Premium build quality and material</li>
            </ul>
          </div>

          {/* Detailed Description */}
          <div className="bg-gray-800/40 p-4 rounded-xl">
            <h4 className="text-xl font-semibold text-orange-500 mb-2">Detailed Description</h4>
            <p className="text-white text-sm leading-relaxed">
              This premium laptop offers a seamless experience for professionals and gamers alike. 
              With its powerful processor, ultra-fast SSD, and high refresh rate display, it ensures smooth multitasking, 
              crisp visuals, and lag-free performance. Ideal for creative work, gaming, and everyday productivity. 
              The laptop comes with enhanced thermal management, a lightweight chassis, and multiple connectivity options. 
              Enjoy crystal-clear audio with high-fidelity speakers and an immersive experience for both work and play.
            </p>
          </div>

          {/* Full Specs */}
          <div className="bg-gray-800/40 p-4 rounded-xl">
            <h4 className="text-xl font-semibold text-orange-500 mb-2">Specifications</h4>
            <table className="w-full text-sm text-white">
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">Display</td>
                  <td>13.6" Liquid Retina, 120Hz</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">Processor</td>
                  <td>Apple M2 / Intel Core i7 / Ryzen 7</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">RAM</td>
                  <td>16GB DDR4 / LPDDR5</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">Storage</td>
                  <td>256GB / 512GB / 1TB SSD</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">Graphics</td>
                  <td>Integrated / RTX 4060 / RTX 5050</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">Battery Life</td>
                  <td>Up to 12 hours</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 font-semibold">Weight</td>
                  <td>1.2 kg – 2.1 kg</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">OS</td>
                  <td>Windows 11 / macOS Ventura</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Buy Now Buttons */}
          <div className="flex gap-4 mt-4">
            <a
              href={selectedProduct.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-[0_0_25px_rgba(255,140,0,0.6)] text-center font-semibold transition"
            >
              Buy Now →
            </a>
            
          </div>

          {/* Dummy Reviews */}
          <div className="bg-gray-800/40 p-4 rounded-xl mt-6">
            <h4 className="text-xl font-semibold text-orange-500 mb-2">Customer Reviews</h4>
            <div className="space-y-4 text-white text-sm">
              <div>
                <span className="font-semibold">John D.</span> ★★★★☆ 
                <p>Excellent laptop, very fast and lightweight. Highly recommended!</p>
              </div>
              <div>
                <span className="font-semibold">Priya S.</span> ★★★★★
                <p>Loved the display and battery life. Perfect for my work and gaming.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default LaptopsShowcase;
