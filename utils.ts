import AsyncStorage from '@react-native-async-storage/async-storage'

export const saveHighScore = async (bpm: number, score: number) => {
  await AsyncStorage.setItem(`highScore-${bpm}`, score.toString())
}

export const getHighScore = async (bpm: number): Promise<number> => {
  const score = await AsyncStorage.getItem(`highScore-${bpm}`)
  return score ? parseInt(score, 10) : 0
}