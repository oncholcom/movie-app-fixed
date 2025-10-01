# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# ================================
# ENHANCED SECURITY & OBFUSCATION
# ================================

# Enable aggressive obfuscation
-optimizations !code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-dontpreverify
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# Rename packages, classes, methods, and fields
-repackageclasses ''
-allowaccessmodification
-overloadaggressively

# Remove debug information
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# Remove logging
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Remove debug and test code
-assumenosideeffects class * {
    public void debug(...);
    public void trace(...);
}

# Obfuscate string literals
-adaptclassstrings

# ================================
# REACT NATIVE SPECIFIC RULES
# ================================

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.proguard.annotations.DoNotStrip
-keep class com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
    void set*(***); 
    *** get*();
}

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# JSC
-keep class org.webkit.** { *; }

# Expo
-keep class expo.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Native modules
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }
-keep class * implements com.facebook.react.bridge.JavaScriptModule { *; }

# Keep native method names
-keepclasseswithmembernames class * {
    native <methods>;
}

# ================================
# ADDITIONAL SECURITY MEASURES
# ================================

# Anti-debugging: Remove debugging symbols
-keepattributes !LocalVariableTable,!LocalVariableTypeTable

# Obfuscate reflection calls
-adaptresourcefilenames    **.properties,**.xml,**.json
-adaptresourcefilecontents **.properties,META-INF/MANIFEST.MF

# Keep serialization classes
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Add any project specific keep options here:
