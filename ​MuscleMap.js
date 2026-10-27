import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { C } from '../theme';
import { scoreColor, weakestMuscle } from '../utils/fitness';

// Shapes in a 200x400 space: [cx, cy, rx, ry] ellipses, or { rect: [x, y, w, h, r] }.
const FRONT = {
  shoulders: [[68, 84, 16, 14], [132, 84, 16, 14]],
  chest: [[85, 104, 16, 15], [115, 104, 16, 15]],
  abs: [{ rect: [87, 124, 26, 58, 9] }],
  biceps: [[50, 122, 10, 23], [150, 122, 10, 23]],
  forearms: [[42, 175, 8, 24], [158, 175, 8, 24]],
  quads: [[83, 252, 18, 50], [117, 252, 18, 50]],
  calves: [[80, 337, 11, 36], [120, 337, 11, 36]],
};
const BACK = {
  traps: [[100, 84, 26, 14]],
  shoulders: [[68, 90, 15, 13], [132, 90, 15, 13]],
  lats: [[82, 126, 14, 34], [118, 126, 14, 34]],
  triceps: [[50, 122, 10, 23], [150, 122, 10, 23]],
  forearms: [[42, 175, 8, 24], [158, 175, 8, 24]],
  glutes: [[86, 206, 17, 15], [114, 206, 17, 15]],
  hamstrings: [[83, 262, 17, 46], [117, 262, 17, 46]],
  calves: [[80, 337, 11, 36], [120, 337, 11, 36]],
};

const AnimEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimRect = Animated.createAnimatedComponent(Rect);

function Figure({ scores, selected, onSelect, width, shapes, pulse }) {
  const weakest = weakestMuscle(scores);
  const draw = (id, sh, key) => {
    const color = scoreColor(scores[id]);
    const sel = selected === id;
    const glowOpacity = id === weakest ? pulse : 0.22;
    const common = { fill: color, fillOpacity: 0.9, stroke: sel ? C.text : color, strokeWidth: sel ? 2 : 1, onPress: onSelect ? () => onSelect(id) : undefined };
    if (Array.isArray(sh)) {
      const [cx, cy, rx, ry] = sh;
      return (
        <React.Fragment key={key}>
          <AnimEllipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} stroke={color} strokeWidth={9} opacity={glowOpacity} />
          <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...common} />
        </React.Fragment>
      );
    }
    const [x, y, w, h, r] = sh.rect;
    return (
      <React.Fragment key={key}>
        <AnimRect x={x} y={y} width={w} height={h} rx={r} fill={color} stroke={color} strokeWidth={9} opacity={glowOpacity} />
        <Rect x={x} y={y} width={w} height={h} rx={r} {...common} />
      </React.Fragment>
    );
  };
  return (
    <Svg width={width} height={width * 2} viewBox="0 0 200 400">
      <Circle cx={100} cy={36} r={20} fill={C.panel} stroke={C.edge} />
      <Rect x={92} y={54} width={16} height={16} rx={6} fill={C.panel} />
      <Rect x={62} y={68} width={76} height={122} rx={26} fill={C.panel} stroke={C.edge} />
      <Rect x={72} y={186} width={56} height={34} rx={14} fill={C.panel} />
      {Object.keys(shapes).flatMap((id) => shapes[id].map((sh, i) => draw(id, sh, `${id}${i}`)))}
    </Svg>
  );
}

// Anatomy map. Weak muscles glow red, strong ones glow neon. Flip rotates between front and back.
// Pass `view` to control the side from outside (used by the Squad comparison).
export default function MuscleMap({ scores, selected, onSelect, width = 220, view, showFlip = true, flipLabel = 'Flip' }) {
  const [internal, setInternal] = useState('front');
  const current = view || internal;
  const rot = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.75, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(pulse, { toValue: 0.25, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const flip = () => {
    Animated.timing(rot, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
      setInternal((v) => (v === 'front' ? 'back' : 'front'));
      rot.setValue(-1);
      Animated.timing(rot, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };
  const rotateY = rot.interpolate({ inputRange: [-1, 1], outputRange: ['-90deg', '90deg'] });

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ perspective: 800 }, { rotateY }] }}>
        <Figure scores={scores} selected={selected} onSelect={onSelect} width={width} shapes={current === 'front' ? FRONT : BACK} pulse={pulse} />
      </Animated.View>
      {showFlip && !view ? (
        <Pressable onPress={flip} style={s.flip}>
          <Text style={{ color: C.volt, fontSize: 13 }}>↻ {flipLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  flip: { marginTop: 6, borderWidth: 1, borderColor: C.volt, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 },
});
