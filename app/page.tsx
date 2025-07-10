import { getServerSession } from "next-auth";
import RegisterForm from './components/RegisterForm';

export default async function Home() {
  const session = await getServerSession();
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="text-gray-600 mt-2">Sign in to your account or create a new one</p>
        </div>

        {session ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
            <p className="text-gray-600 mb-4">You are signed in as {session.user?.name}</p>
            <a 
              href="/protected" 
              className="inline-block bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Go to Protected Page
            </a>
          </div>
        ) : <></>}
      </div>
    </div>
  );
}
