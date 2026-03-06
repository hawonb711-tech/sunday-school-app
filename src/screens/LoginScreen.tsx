import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SIZES, SHADOWS, GLASS } from '../constants/theme';

interface Props {
  onLogin: (email: string, password: string) => void;
  onGoogleLogin: () => void;
}

export default function LoginScreen({ onLogin, onGoogleLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.bg}>
      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoPill}>
              <Text style={styles.logoText}>SS</Text>
            </View>
            <Text style={styles.title}>Sunday School</Text>
            <Text style={styles.subtitle}>주일학교 출석 관리</Text>
          </View>

          <View style={[styles.form, GLASS.card]}>
            <Text style={styles.formTitle}>로그인</Text>
            <Text style={styles.formSub}>계정에 로그인하세요</Text>

            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => onLogin(email, password)}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>로그인</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={[styles.googleBtn, GLASS.card]} onPress={onGoogleLogin} activeOpacity={0.8}>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleLabel}>Google로 계속</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.demo}>빈칸으로 로그인하면 데모 모드로 입장합니다</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  blob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(99, 91, 255, 0.3)',
    top: -60, left: -80,
  },
  blob2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    top: 200, right: -100,
  },
  blob3: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    bottom: 100, left: -50,
  },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoPill: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.glow,
  },
  logoText: { fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: -1 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  form: {
    borderRadius: SIZES.radiusXl,
    padding: 28,
    ...SHADOWS.large,
  },
  formTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  formSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 24 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, color: COLORS.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.glow,
  },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textLight, paddingHorizontal: 16, fontSize: 13 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: SIZES.radiusMd, paddingVertical: 14, gap: 10,
  },
  googleG: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  demo: {
    color: 'rgba(255,255,255,0.3)', textAlign: 'center',
    marginTop: 24, fontSize: 12,
  },
});
