/**
 * Entity class definition and management.
 * 
 * Requires bt.js
 * May be run in Node.js or browser. (thus the function check)
**/
if (typeof(requireFromPublicJs)==='function') bt = requireFromPublicJs('bt').bt;

bt.extend(bt,{
  //
  // Entity storage and fetching
  //
  entities : {},
  /**
   * Get or set entity by id.
   * @param id string; id of entity or get or set.
   * @param ent object; entity to store with given id.
   * @param cat string; categorization for entity.
   */
  entity : function(id,ent,cat){
    if (bt.def(id)){
      if (bt.def(ent)){
        if (bt.def(cat)){
          if (!bt.def(bt.entities[cat])) bt.entities[cat] = [];
          bt.entities[cat][id] = ent;
        } else {
          bt.entities[id] = ent;
        }
      } else if (bt.str(id)){
        cat ? bt.entities[cat][id] : bt.entities[id];
      }
      return id;
    }
  },
  entityOfType : function(id,type){
    return bt.entity(id,undefined,type);
  },
  nextIdForType : function(type){
    if (!bt.def(bt.entities[type])) bt.entities[type] = [];
    return bt.entities[type].length;
  },
  /**
   * Get all entities of given type or category.
   */
  entitiesOfType : function(type){
    var ents = [];
    if (bt.entities[type])
      ents = bt.entities[type];
    else
    for (var uid in bt.entities){
      var ent = bt.entities[uid];
      if (ent && 
        bt.fn(ent.ofType) && 
        ent.ofType(type))
          ents.push(ent);
    }
    return ents;
  },
  /**
   * Is passed entity of given type?
   */
  ofType : function(ent,type){
    if (ent && bt.fn(ent.ofType))
      return ent.ofType(type);
  },
  /**
   * Get universal id of passed entity,
   * comprised of its abbreviation + id.
   */
  uid : function(ent){
    if (bt.str(ent)) return ent;
    return ent ? (ent.abbrev+ent.id) : null;
  },
  /**
   * Get property of entity without throwing error if cannot be resolved.
   * 
   * EXAMPLE:
   * > bt.resolve([person,'attributes','name'])
   * Which is safer than person.attributes.name
   */
  resolve : function(subj){
    var subObj = bt.entity(subj[0]);
    if (subj.length > 1)
    for (var s=0; s < subj.length; s++){
      try {
        subObj = subObj[subj[s]];
      } catch(e){
        return null;
      }
    }
    return subObj;
  },
  /**
   * If passed entity/property path resolves to a
   * function, then apply the parameters to it.
   * @parameter resolve Array.
   * @parameter params Array.
   * @return result of resolved function.
   */
  safeApply : function(resolve,params){
    var obj = bt.resolve(resolve);
    if (bt.fn(obj)) return obj.apply(obj,params);
  },
  /**
   * Set's property at passed resolve path to val.
   */
  safeSet : function(resolve,val){
    var prop = resolve.pop(),
        subj = bt.resolve(resolve);
    if (bt.obj(subj)) subj[prop] = val;
  },
  /**
   * Set array of property resolvers to values 
   * at same index in vals array.
   */
  assign : function(vars,vals){
    for (var i=0; i < vars.length; i++){
      bt.safeSet(vars[i],vals[i]);
    }
  },
  /**
   * Defines a class with given name, super classes to inherit from, class properties/
   * methods, instance properties/methods, prototype, and optional additional constructor
   * logic.
   * NOTE: super classes can be specified as strings if they belong to the same parent.
   * @param pa Object; parent library of class.
   * @param n String; name of class.
   * @param a String; abbreviation for class.
   * @param sup Object; super class(es) to extend.
   * @param cps Object; class properties and methods.
   * @param ips Object; instance properties and methods.
   * @param pr Object; prototype for class.
   * @param f Function; optional additional constructor logic.
   */
  defClass : function(pa,n,a,sup,cps,ips,pr,f){
    bt.abbrev(a,n,pa); // register class abbreviation.
    // resolve submitted super classes.
    if (sup && !bt.arr(sup)) sup = [sup];
    for (var i=0; i < sup.length; i++)
    if (bt.str(sup[i])) sup[i] = pa[sup[i]];
    //
    // define class constructor.
    //
    //pa[n] = function(props){
    var fn = function(props){
      // begin types array.
      if (!bt.def(this.types)) this.types = [];
      bt.appendNew.call(this.types,n);
      // execute super class constructors.
      if (sup && sup.length)
      for (var i=0; i < sup.length; i++)
        sup[i].call(this,props);
      // apply standard instance properties
      this.abbrev = a;
      this.type = n;
      this.classRef = pa[n];
      // assign passed instance properties.
      if (ips) for (var i in ips) this[i] = bt.clone(ips[i]);
      // apply properties passed to constructor.
      if (props) for (var i in props) this[i] = props[i];
      // execute additional constructor logic if specified.
      if (bt.fn(f)) f.call(this);
    };
    // wrap definition in eval so we can name the constructor function.
    eval("pa[n] = function "+n+"(props){ fn.call(this,props) }");
    pa[n].abbrev = a;
    pa[n].type = n;
    // define default `make` class method.
    pa[n].make = function(p){ return new pa[n](p) };
    // assign provided prototype to class.
    pa[n].prototype = pr ? pr : {};
    // inherit super class prototypes.
    if (sup && sup.length){
      //console.log("bt.defClass(",n,") | "+n+".prototype BEFORE:",bt.keys(pa[n].prototype));
      bt.extend(pa[n].prototype,sup);
      //console.log("bt.defClass(",n,") | sup:",sup," "+n+".prototype AFTER:",bt.keys(pa[n].prototype));
    }
    // assign passed class properties/methods
    if (cps) for (var c in cps) pa[n][c] = cps[c];
  }
});

/**
 * Define Entity root class.
 */
bt.defClass(
  bt, // parent library
  "Entity", // class name
  null, // class abbreviation
  [], // super classes
  // class-level properties/methods
  {
    trackEntity : function(ent){
      if (ent && bt.fn(ent.uid)){
        //console.log("bt.Entity.trackEntity...",ent.type);
        ent.id = bt.nextIdForType(ent.type);
        bt.entity(ent.id,ent,ent.type); // store in category.
        bt.entity(bt.uid(ent),ent); // store by uid.
      }
    },
    untrackEntity : function(ent){
      if (ent && bt.fn(ent.uid)){
        var type = ent.type,
            id = ent.id,
            uid = ent.uid();
        bt.entities[type][id] = undefined;
        delete bt.entities[uid];
        //console.log("bt.Entity.untrackEntity...","type:"+type,"id:"+id,"uid:"+uid);
      }
    }
  },
  // instance-level properties
  { 
    active : 1,
    name : null
  },
  // prototype methods
  { 
    ofType : function(type){
      return this.types ? this.types.indexOf(type) > -1 : false;
    },
    uid : function(){
      return bt.uid(this);
    },
    track : function(){
      bt.Entity.trackEntity(this);
    },
    untrack : function(){
      bt.Entity.untrackEntity(this);
    }
  },
  // extra constructor logic
  // NOTE: this will always be executed in the context of this class, so
  //       inheriting classes should also perform this from their vantage.
  function(){
    /* replaced by `bt.Entity.registerEntity.call`
    console.log("bt.Entity construct...");
    this.id = bt.nextIdForType(this.type);
    bt.entity(bt.uid(this),this);
    */
  }
);

if ((typeof(exports)!=='undefined') && exports) exports.bt = bt;