import "./App.css";

import Main from "./main";
import AuthContextProvider from "./libs/context/authContext";
import NoInternetConnection from "./components/internetConnection";
import InstallAppPrompt from "./components/pwa/InstallAppPrompt";

function App() {
  return (
    <NoInternetConnection>
      <AuthContextProvider>
        <Main />
        <InstallAppPrompt />
      </AuthContextProvider>
    </NoInternetConnection>
  );
}

export default App;
