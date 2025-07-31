import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font'
import 'react-native-reanimated'

import BPM from '@/screens/BPM'
import MainMenu from '@/screens/MainMenu'

import { useColorScheme } from '../hooks/useColorScheme'

export type RootStackParamList = {
  MainMenu: undefined
  BPM: { itemId: number, title: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  if (!loaded) return null

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="MainMenu" >
        <Stack.Screen name="MainMenu" component={MainMenu} options={{ headerShown: false }} />
        <Stack.Screen name="BPM" component={BPM} options={{ headerShown: false }} />
      </Stack.Navigator>
    </ThemeProvider>
  )
}
