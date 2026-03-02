# Fix swipe mode to show one profile at a time like Tinder
$content = Get-Content "pages\Feed.tsx"
# Replace the swipe mode section with Tinder-style implementation
$swipeSection = '
        ) : (
          // Swipe Mode - One profile at a time (Tinder-style)
          filteredMatches.length > 0 ? (
            <div className="relative">
              {/* Profile Counter */}
              <div className="text-center mb-4">
                <span className="text-sm font-black text-gray-500">
                  {currentSwipeIndex + 1} / {filteredMatches.length}
                </span>
              </div>

              {/* Current Profile */}
              <div className="bg-white rounded-[3.5rem] p-5 shadow-2xl border-4 border-white hover:border-rose-50 transition-all overflow-hidden group">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-6">
                  <img 
                    src={filteredMatches[currentSwipeIndex]?.images?.[0]} 
                    crossOrigin="anonymous" 
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={filteredMatches[currentSwipeIndex]?.name} 
                  />
                  <div className="absolute bottom-0 inset-x-0 p-10 bg-gradient-to-t from-black/90 to-transparent text-white">
                    <h3 className="text-3xl font-black mb-2 tracking-tight">
                      {filteredMatches[currentSwipeIndex]?.name}, {filteredMatches[currentSwipeIndex]?.age}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-200"> 
                      <MapPin size={16} fill="currentColor" /> {filteredMatches[currentSwipeIndex]?.city}, {filteredMatches[currentSwipeIndex]?.country} 
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                       {filteredMatches[currentSwipeIndex]?.churchName || "Faithful Christian"}
                     </span>
                  </div>
                  <p className="text-gray-600 font-bold text-base mb-8 line-clamp-3 italic leading-relaxed">
                    "{filteredMatches[currentSwipeIndex]?.bio}"
                  </p>
                  
                  {/* AI Insight Display */}
                  {aiInsight?.id === filteredMatches[currentSwipeIndex]?.id && (
                    <div className="mb-8 p-6 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100 animate-in fade-in zoom-in duration-500">
                      <div className="flex items-center gap-2 mb-3 text-indigo-600">
                        <Sparkles size={14} fill="currentColor" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Spiritual Discernment</span>
                      </div>
                      <p className="text-indigo-900 font-bold text-sm italic leading-relaxed">"{aiInsight.text}"</p>
                    </div>
                  )}

                  {/* Swipe Actions */}
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleSwipeLeft()}
                      disabled={currentSwipeIndex === 0}
                      className="h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={28} />
                    </button>
                    <button 
                      onClick={() => handleSwipeConnect()}
                      className="h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center gap-3 shadow-xl shadow-rose-100 font-black uppercase text-xs tracking-widest hover:bg-rose-700 active:scale-95 transition-all"
                    > 
                      <Heart size={24} fill="currentColor" /> Connect 
                    </button>
                    <button 
                      onClick={() => generateSpiritualDiscernment(filteredMatches[currentSwipeIndex])} 
                      disabled={loadingAiId === filteredMatches[currentSwipeIndex]?.id}
                      className="h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    > 
                      {loadingAiId === filteredMatches[currentSwipeIndex]?.id ? <Loader2 className="animate-spin" /> : <Sparkles size={28} />} 
                    </button>
                  </div>
                </div>
              </div>

              {/* Swipe Navigation */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={() => handleSwipeLeft()}
                  disabled={currentSwipeIndex === 0}
                  className="p-4 rounded-full bg-white shadow-lg border-2 border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={24} />
                </button>
                <button
                  onClick={() => handleSwipeRight()}
                  disabled={currentSwipeIndex === filteredMatches.length - 1}
                  className="p-4 rounded-full bg-white shadow-lg border-2 border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Heart size={24} />
                </button>
              </div>

              {/* Keyboard Navigation Hints */}
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                  Use ← → arrow keys to navigate • Space to connect
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-[4rem] border-4 border-dashed border-rose-50 shadow-inner">
               <ShieldCheck className="mx-auto text-rose-100 mb-6" size={64} />
               <h3 className="text-2xl font-black text-rose-950">No matches found</h3>
               <p className="text-gray-400 font-bold text-sm mt-2 px-12">Try adjusting your age filters or expanding your search scope above.</p>
            </div>
          )}'

# Find and replace the old swipe section
$startIndex = $content.IndexOf("          // Swipe Mode - Vertical list (current behavior)")
if ($startIndex -ne -1) {
  $beforeSwipe = $content.Substring(0, $startIndex)
  $afterSwipe = $content.Substring($startIndex + $content.Substring($startIndex).IndexOf(") : ("))
  $newContent = $beforeSwipe + $swipeSection + $afterSwipe
  Set-Content "pages\Feed.tsx" $newContent
} else {
  Write-Host "Could not find swipe section to replace"
}'
