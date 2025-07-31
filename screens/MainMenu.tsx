import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type BPMEntry = {
  bpm: number;
  highScore: number;
  barLength: number;
};

export default function MainMenu({ navigation }: any) {
  const [bpmInput, setBpmInput] = useState('');
  const [barLengthInput, setBarLengthInput] = useState('');
  const [bpmList, setBpmList] = useState<BPMEntry[]>([]);

  useEffect(() => {
    loadStoredBPMs();
  }, []);

  const loadStoredBPMs = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bpmKeys = keys.filter((key) => key.startsWith('highScore-'));
      const stores = await AsyncStorage.multiGet(bpmKeys);

      const newList: BPMEntry[] = stores.map(([key, value]) => {
        const bpm = parseInt(key.replace('highScore-', ''), 10);
        const highScore = value ? parseInt(value, 10) : 0;

        // Try to keep existing bar length from previous state
        const existing = bpmList.find((entry) => entry.bpm === bpm);
        const barLength = existing ? existing.barLength : 4;

        return { bpm, highScore, barLength };
      });

      newList.sort((a, b) => a.bpm - b.bpm);
      setBpmList(newList);
    } catch (e) {
      console.error('Failed to load scores', e);
    }
  };


  const addBPM = async () => {
    const bpm = parseInt(bpmInput);
    const barLength = parseInt(barLengthInput);

    if (isNaN(bpm) || bpm <= 0 || isNaN(barLength) || barLength <= 0) return;

    const exists = bpmList.find((entry) => entry.bpm === bpm);
    if (!exists) {
      await AsyncStorage.setItem(`highScore-${bpm}`, '0');
      setBpmList((prev) =>
        [...prev, { bpm, highScore: 0, barLength }].sort((a, b) => a.bpm - b.bpm)
      );
    }

    setBpmInput('');
    setBarLengthInput('');
  };

  const deleteBPM = async (bpm: number) => {
    try {
      await AsyncStorage.removeItem(`highScore-${bpm}`);
      setBpmList((prev) => prev.filter((item) => item.bpm !== bpm));
    } catch (e) {
      console.error('Failed to delete BPM', e);
    }
  };

  const renderItem = ({ item }: { item: BPMEntry }) => (
    <View style={styles.bpmItem}>
      <TouchableOpacity
        style={styles.bpmButton}
        onPress={() =>
          navigation.navigate('BPM', {
            bpm: item.bpm,
            highScore: item.highScore,
            bars: item.barLength ?? 4,
          })
        }
      >
        <Text style={styles.bpmText}>
          BPM: {item.bpm} | Bar: {item.barLength ?? 4}
        </Text>
        <Text style={styles.bpmText}>
          High Score: {item.highScore}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteBPM(item.bpm)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rhythm Practice</Text>

      <TextInput
        placeholder="Enter BPM"
        keyboardType="numeric"
        value={bpmInput}
        onChangeText={(text) => setBpmInput(text.replace(/[^0-9]/g, ''))}
        style={styles.input}
      />
      <TextInput
        placeholder="Bar Length (e.g. 4)"
        keyboardType="numeric"
        value={barLengthInput}
        onChangeText={(text) => setBarLengthInput(text.replace(/[^0-9]/g, ''))}
        style={styles.input}
      />
      <TouchableOpacity style={styles.addButton} onPress={addBPM}>
        <Text style={styles.addButtonText}>Add BPM</Text>
      </TouchableOpacity>

      <FlatList
        data={bpmList}
        keyExtractor={(item) => item.bpm.toString()}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bpmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bpmButton: {
    flex: 1,
    backgroundColor: '#EEE',
    padding: 12,
    borderRadius: 5,
  },
  bpmText: {
    fontSize: 16,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
    color: 'red',
  },
});
