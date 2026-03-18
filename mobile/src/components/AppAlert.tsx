import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface AppAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const AppAlert: React.FC<AppAlertProps> = ({ visible, title, message, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable onPress={onClose} style={styles.btn}>
            <Text style={styles.btnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  message: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
  btn: { marginTop: 14, alignSelf: 'flex-end', backgroundColor: colors.text, paddingHorizontal: 16, paddingVertical: 9 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
});

export default AppAlert;
