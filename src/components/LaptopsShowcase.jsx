import React from "react";

const LaptopsShowcase = () => {


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
    <div className="w-full px-0 py-2 show-case" style={{width:'100vw',marginLeft:'-40px'}}>

      <h2 className="text-2xl font-semibold text-white mb-6 px-20" style={{marginBottom:'10px'}}>
        Check out these options
      </h2>

      <div className="flex gap-6 overflow-x-auto pb-4 px-6 no-scrollbar">

        {products.map((product) => (
          <a href={product.url} target="_blank">
            <div
              key={product.id}
              className="min-w-[280px] bg-black/70 rounded-2xl shadow-xl p-4 flex flex-col transition "
            >
              <div className=" flex items-center justify-center mb-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>
            
              <h3 className="text-lg text-orange-500 font-semibold mb-2">
                {product.name}
              </h3>
            
              <p className="text-sm text-white mb-3">
                {product.specs}
              </p>
            
              <div className="mt-auto text-xl font-bold text-orange-600">
                {product.price}
              </div>
            </div>
          </a>
        ))}

      </div>
    </div>
  );
};

export default LaptopsShowcase;
