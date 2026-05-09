import "./App.css";

import Main from "./main";
import AuthContextProvider from "./libs/context/authContext";
import NoInternetConnection from "./components/internetConnection";

function App() {
  return (
    <NoInternetConnection>
      <AuthContextProvider>
        <Main />
      </AuthContextProvider>
    </NoInternetConnection>
  );
}

export default App;
