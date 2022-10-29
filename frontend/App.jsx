import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Leaflet from "./components/Leaflet/Leaflet";
import Navbar from "./components/Navbar/Navbar";

export default function App() {

    const Stack = createNativeStackNavigator();

    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Map" component={Leaflet} options={{headerShown: false}}/>
            </Stack.Navigator>
        </NavigationContainer>

    );
}