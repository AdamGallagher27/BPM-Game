import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

type Props = {
  route: any
  navigation: any
}

export default function BPM({ route, navigation }: Props) {
  const { bpm, bars } = route.params
  const beatInterval = (60 / bpm) * 1000
  const barLength = bars ?? 4
  const countdownBeats = barLength

  const [countdown, setCountdown] = useState(countdownBeats)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(1)
  const [isGameOver, setIsGameOver] = useState(false)

  const lastBarStart = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const countdownRef = useRef(countdownBeats)
  const soundRef = useRef<Audio.Sound | null>(null)
  const beatFlash = useRef(new Animated.Value(1)).current
  const bgColorAnim = useRef(new Animated.Value(0)).current


  useEffect(() => {
    loadHighScore()
    loadMetronomeSound()
    startCountdown()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (soundRef.current) soundRef.current.unloadAsync()
    }
  }, [])

  const loadHighScore = async () => {
    const key = `highScore-${bpm}`
    const saved = await AsyncStorage.getItem(key)
    if (saved) setHighScore(parseInt(saved, 10))
  }

  const saveHighScore = async (newScore: number) => {
    const key = `highScore-${bpm}`
    await AsyncStorage.setItem(key, newScore.toString())
  }

  const loadMetronomeSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/metronome.mp3')
    )
    soundRef.current = sound
  }

  const playClick = async () => {
    try {
      if (soundRef.current) await soundRef.current.replayAsync()
    } catch (e) {
      console.warn('Sound failed', e)
    }
  }

  const startCountdown = () => {
    setCountdown(countdownBeats)
    countdownRef.current = countdownBeats

    // Play first click immediately
    playClick()

    intervalRef.current = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)

      // Play click on each countdown tick
      playClick()

      if (countdownRef.current <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null

        setIsPlaying(true)
        setCurrentBeat(1)
        lastBarStart.current = Date.now()

        // Play click for first game beat
        playClick()
        animateBeat()
        startGameLoop()
      }
    }, beatInterval)
  }

  const startGameLoop = () => {
    intervalRef.current = setInterval(() => {
      animateBeat()
      playClick()

      setCurrentBeat((prev) => {
        const next = prev === barLength ? 1 : prev + 1
        if (next === 1) {
          lastBarStart.current = Date.now()
        }
        return next
      })
    }, beatInterval)
  }

  const animateBeat = () => {
    beatFlash.setValue(1.4)
    Animated.spring(beatFlash, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start()
  }

  const flashBackground = (color: 'green' | 'red', thenEndGame = false) => {
    const toValue = color === 'green' ? 1 : -1

    bgColorAnim.setValue(0)

    const greenFlash = [
      Animated.timing(bgColorAnim, {
        toValue,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(bgColorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]

    const redHold = [
      Animated.timing(bgColorAnim, {
        toValue,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.delay(1000), // hold red for 1 second
    ]

    Animated.sequence(color === 'green' ? greenFlash : redHold).start(() => {
      if (thenEndGame) endGame()
    })
  }


  const handleTap = () => {
    if (!isPlaying || lastBarStart.current === null) return

    const now = Date.now()
    const diff = Math.abs(now - lastBarStart.current)
    const hitWindow = beatInterval * 0.3

    if (currentBeat === 1 && diff <= hitWindow) {
      flashBackground('green')
      setScore((prev) => prev + 1)
    } else {
      flashBackground('red', true)
    }
  }

  const endGame = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsPlaying(false)

    if (score > highScore) {
      await saveHighScore(score)
      setHighScore(score)
    }

    setIsGameOver(true)
  }


  const restartGame = () => {
    setScore(0)
    setCurrentBeat(1)
    setIsGameOver(false)
    bgColorAnim.setValue(0) // reset background to white
    startCountdown()
  }

  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['#fa003f', '#ffffff', '#33b864'], // red, white, green
  })

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[styles.container, { backgroundColor }]}>
        {!isPlaying && !isGameOver && (
          <Text style={styles.title}>
            Starting in... {countdown > 0 ? countdown : 'Go!'}
          </Text>
        )}

        {isPlaying && (
          <>
            <Text style={styles.score}>Score: {score}</Text>
            <Animated.Text
              style={[styles.beat, { transform: [{ scale: beatFlash }] }]}
            >
              {currentBeat}
            </Animated.Text>
          </>
        )}

        <Modal visible={isGameOver} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Game Over</Text>
              <Text style={styles.modalText}>Score: {score}</Text>
              <Text style={styles.modalText}>High Score: {highScore}</Text>
              <View style={{ marginTop: 20 }}>
                <Button title="Restart" onPress={restartGame} />
                <View style={{ height: 10 }} />
                <Button title="Back to Menu" onPress={() => navigation.goBack()} />
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </TouchableWithoutFeedback>
  )

}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  score: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  beat: { fontSize: 64, fontWeight: 'bold', color: 'blue' },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 20, marginTop: 5 },
})
