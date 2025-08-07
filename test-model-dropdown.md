# Model Selection Feature Test Plan

## ✅ **Implemented Features:**

### 1. **Model Dropdown UI**
- [x] Added model dropdown next to provider dropdown
- [x] CSS styling for responsive design
- [x] Mobile-friendly layout

### 2. **Model Options per Provider**
- [x] **Gemini Models:**
  - `gemini-2.5-pro` (Best Quality) - Compatible with: comprehensive, deep, reasoning, youtube
  - `gemini-2.5-flash` (Balanced) - Compatible with: quick, comprehensive, deep
  - `gemini-2.5-flash-lite` (Fastest) - Compatible with: quick

- [x] **Perplexity Models:**
  - `sonar-reasoning-pro` - Compatible with: reasoning, deep
  - `sonar-pro` - Compatible with: comprehensive, deep
  - `sonar` - Compatible with: quick, comprehensive
  - `sonar-deep-research` - Compatible with: deep

- [x] **Tavily/Exa:**
  - Single option (no model selection needed)

### 3. **Research Mode Integration**
- [x] Model dropdown updates when research mode changes
- [x] Only compatible models shown for each research mode
- [x] Model selection persisted per research mode
- [x] YouTube mode locks to Gemini provider

### 4. **Event Handlers**
- [x] Provider change updates model options
- [x] Model change updates research mode config
- [x] YouTube mode validation
- [x] Settings persistence

### 5. **Validation & Error Handling**
- [x] Model compatibility validation
- [x] YouTube mode provider lock
- [x] Notice messages for invalid selections
- [x] Fallback to default models

## 🧪 **Test Cases:**

### **Case 1: Provider Switch**
1. Start with Gemini provider
2. Switch to Perplexity
3. ✅ Model dropdown should update with Perplexity models
4. ✅ Current selection should reflect perplexity model for current research mode

### **Case 2: Research Mode Switch**
1. Select "Quick" mode
2. ✅ Model dropdown should only show compatible models (fast models)
3. Select "Deep" mode
4. ✅ Model dropdown should show advanced models

### **Case 3: YouTube Mode Lock**
1. Switch to Perplexity provider
2. Select YouTube research mode
3. ✅ Should auto-switch back to Gemini
4. ✅ Should show notice about provider requirement

### **Case 4: Model Persistence**
1. Select "Deep" mode with Gemini 2.5 Pro
2. Switch to "Quick" mode
3. Switch back to "Deep" mode
4. ✅ Should remember Gemini 2.5 Pro selection

### **Case 5: Settings Sync**
1. Change model in chat UI
2. Check settings tab
3. ✅ Advanced settings should reflect the change

## 🎯 **Key Benefits:**

1. **User Experience:**
   - Simple dropdown for everyday use
   - Advanced settings for power users
   - Intelligent defaults and validation

2. **Flexibility:**
   - Different models for different research modes
   - Provider-specific optimization
   - Research mode compatibility

3. **Consistency:**
   - Chat UI and Settings UI stay in sync
   - Persistent preferences
   - Clear feedback to users

## 🔧 **Technical Implementation:**

### **Core Methods:**
- `updateModelDropdown()` - Updates available models
- `getAvailableModels()` - Returns compatible models
- `isCurrentModel()` - Checks current selection
- `updateModelForCurrentMode()` - Saves model choice

### **Data Flow:**
1. User selects research mode → Updates compatible models
2. User selects provider → Updates available models
3. User selects model → Updates research mode config
4. Settings persist → Next session loads correctly

### **Responsive Design:**
- Desktop: Provider and Model side by side
- Mobile: Stacked layout with full width dropdowns
- Touch-friendly minimum sizes

## ✅ **Status: COMPLETE**

All core features implemented and tested successfully!
