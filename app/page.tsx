import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 content-center">
      <div className="max-w-md flex flex-col mx-auto">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D2D2D] mb-6">
            Projecten delen. Klanten betrekken.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Een simpel portaal voor duidelijke communicatie en overzicht met je klanten.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/auth/login"
              className="bg-[#5E4AE3] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#4a3abf] transition"
            >
              Start nu
            </a>
            <a
              href="#features"
              className="border border-[#5E4AE3] text-[#5E4AE3] px-6 py-3 rounded-xl font-medium hover:bg-[#EAE6FB] transition"
            >
              Meer info
            </a>
        </div>
      </div>
        {session ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">Welkom terug, {session.user?.name}!</p>
            <a 
              href="/protected" 
              className="inline-block bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Ga naar de beveiligde pagina
            </a>
          </div>
        ) : 
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welkom</h1>
          <p className="text-gray-600 mt-2">Log in op je account of maak een nieuwe aan</p>
        </div>
        }
      </div>
    </div>
  );
}
