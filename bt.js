/**
 * Core bt library required for all extensions.
 * 
 * No requirements
 * May be run in Node.js or browser.
**/

bt = {
  /**
   * Get or set abbreviations for full names.
   * Pass just abbreviation to get full name.
   * Pass just full name to get abbreviation.
   * Pass both to set abbreviation for full name.
   * @param abbrev string; abbreviation to get/set.
   * @param name string; full name to get or set.
   * @param parent object; object to store abbreviations in.
   * @return string; abbreviation or name if getting.
   */
  abbrev:function(abbrev,name,parent){
    if (!bt.def(parent)) parent = bt;
    if (!parent.abbreviations) parent.abbreviations = {};
    if (abbrev && bt.def(name))
      parent.abbreviations[abbrev]=name;
    else if (abbrev)
      return parent.abbreviations[abbrev];
    else if (name)
    for (var a in parent.abbreviations)
    if (parent.abbreviations[a]===name)
      return a;
  },
  /**
   * Functor for processing values with a function.
   * @param v: value or object to process.
   * @param fn: processing function.
   * @param struct: keep results in same structure?
   * @param o: use OR accumulation instead of AND?
   */
  f : function(v, fn, struct, o){
    if (bt.def(v))
    if (bt.arr(v) || bt.obj(v)){
      var verdict = !struct ? 1 :
          (bt.arr(v) ? [] : {}),
          vf = function(i){
            var r = fn(v[i]);
            if (struct) verdict[i] = r;
            else if (o) verdict = verdict || r;
            else verdict = verdict && r;
          };
      // traverse values in array or object
      // process the same regardless.
      if (bt.arr(v))
        for (var i=0; i<v.length; i++) vf(i);
      else if (bt.obj(v))
        for (var i in v) vf(i);
      return verdict;
    } else {
      return fn(v);
    }
  },
  
  //
  // type confirmers...
  //
  /**
   * Is the item passed not undefined?
   */
  def : function(v){
    return v!==undefined;
  },
  /**
   * Is the item passed an object?
   */
  obj : function(v){
    return v instanceof Object;
  },
  /**
   * Is the item passed a function?
   */
  fn : function(v){
    return typeof(v)==="function";
  },
  /**
   * Is the item passed an Array?
   */
  arr : function(v){
    return v instanceof Array;
  },
  /**
   * Is the item passed a number?
   */
  num : function(v){
    return !isNaN(parseFloat(v));//&& isFinite(v);
  },
  /**
   * Is the item passed a string?
   */
  str : function(v){
    return typeof(v)==="string";
  },
  
  //
  // Utilities...
  //
  /**
   * Must be called via apply/call, passing Array
   * instance followed by items to append to it if
   * they are not already present.
   *
   * EXAMPLE:
   * > bt.appendNew.call(['a'],'a','b')
   * This will append 'b' but not 'a' because it's
   * already present in the array.
   */
  appendNew : function(){
    if (bt.arr(this))
    for (var i=0; i<arguments.length; i++){
      var a = arguments[i];
      if (this.indexOf(a)===-1) this.push(a);
    }
  },
  
  /**
   * Copies content of sources to destination.
   * @param dest obj; destination to extend.
   * @param sources obj|array; source(s) from-which
   *        to copy unique values to destination.
   */
  extend : function(dest,sources){
    var types = dest.type ? [dest.type] : [];
    if (dest.abbrev)
      bt.abbrev(dest.abbrev,dest.type);
    if (!bt.arr(sources)) sources = [sources];
    if (sources.length)
    for (var s=0; s<sources.length; s++){
      var src = sources[s];
      if (bt.def(src.prototype))
        src = src.prototype;
      for (var p in src) 
        if (!bt.def(dest[p]))
          dest[p] = src[p];
      if (bt.arr(src.types))
        bt.appendNew.apply(types,src.types);
    }
    dest.types = types;
  }
};
//
// Add additional functionality via extend.
// Basic functionality
//
bt.extend(bt,{
  /**
   * Convert passed value to a number.
   */
  val : function(v){
    var r = v-0;
    return isNaN(r) ? 0 : r;
  },
  /**
   * Convert to number with specified precision.
   */
  n : function(v,p){
    return bt.val(v).toFixed(p);
  },
  pad : function(v,p){
    var s = v+'';
    if (isFinite(p)) while (s.length < p) s = "0"+s;
    return s;
  },
  
  /**
   * Create duplicate of variable passed.
   * Functions are simply returned.
   */
  clone : function(v){
    if (bt.fn(v)) return v;
    if (bt.arr(v) || bt.obj(v)){
      return bt.f(v,bt.clone,1); // retrain structure.
    } else if (bt.str(v)){
      return v+"";
    } else if (bt.num(v)){
      return v-0;
    }
  },
  
  /**
   * Get value for key at parent or alternative if not defined.
   * @param p Object; parent containing key.
   * @param k String; name of property.
   * @param a Mixed; alternative value.
   * @return Mixed; value of key or alternative.
   */
  getOr : function(p,k,a){
    if (p && bt.def(k) && bt.def(p[k])) return p[k];
    return a;
  },
  /**
   * Get range of values from array.
   */
  getRange : function(arr,fromIdx,toIdx){
    var vals = [];
    if (bt.arr(arr))
    for (var i=fromIdx; i <= toIdx; i++) vals.push(arr[i]);
    return vals;
  },
  
  /**
   * Must be called via apply/call like appendNew.
   * Drops the specified values from context array.
   * 
   * EXAMPLE:
   * > test = ['a','b','c','d'];
   * > bt.exclude.call(test,'b','c');
   * This will reduce test to ['a','d'].
   */
  exclude : function(){
    if (bt.arr(this)){
      var exclude = Array.prototype.slice.call(arguments);
      for (var i=0; i < this.length; i++){
        var a = this[i];
        if (exclude.indexOf(a) > -1){
          this.splice(i,1); i--;
        }
      }
    }
  },
  /**
   * Must be called via apply/call like appendNew.
   * Drops any values from context array not included in arguments.
   * 
   * EXAMPLE:
   * > test = ['a','b','c','d'];
   * > bt.keepOnly.call(test,'b','c');
   * This will reduce test to ['b','c'].
   */
  keepOnly : function(){
    if (bt.arr(this)){
      var keep = Array.prototype.slice.call(arguments);
      for (var i=0; i < this.length; i++){
        var a = this[i];
        if (keep.indexOf(a)===-1) this.splice(i,1);
      }
    }
  },
  
  /**
   * Define key of parent with value if not yet defined.
   * If key is an array, each index of key and value params will be processed.
   * @param p Object; parent object to apply values to.
   * @param k Mixed; key(s) to define value(s) for.
   * @param v Mixed; value(s) to define for key(s).
   */
  define : function(p,k,v){
    if (bt.isArr(k)) for (var i=0; i < k.length; k++) bt.define(p,k[i],v[i]);
    if (!bt.def(p[k])) p[k]=v;
  },
  
  /**
   * Return array of keys from passed object.
   */
  keys : function(v){
    var keys=[];
    if (v && bt.obj(v))
    for (var k in v) keys.push(k);
    return keys;
  },
  
  /**
   * Numeric sorting for Array.sort
   * 
   * EXAMPLE:
   * > array.sort(bt.arrSortNum)
   */
  arrSortNum : function(a,b){ return a-b; }
});
//
// Extra functionality.
//
bt.extend(bt,{
  
  /**
   * Converts bracketed list string to an array.
   * 
   * EXAMPLE:
   * > tt.bracketsToArray('[a][b][c]')
   * returns ['a','b','c'].
   */
  bracketsToArray : function(str){
    var arr = str.split(']['),
        len = arr.length;
    arr[0] = arr[0].substr(1);
    arr[len-1] = arr[len-1].substr(0,arr[len-1].length-1);
    return arr;
  },
  /**
   * Converts array to bracketed list string.
   * 
   * EXAMPLE:
   * > tt.bracketsToArray(['a','b','c'])
   * returns '[a][b][c]'.
   */
  arrayToBrackets : function(arr){
    var str = '';
    if (arr && arr.length) str = '['+arr.join('][')+']';
    return str;
  }
  
});

if ((typeof(exports)!=='undefined') && exports) exports.bt = bt;