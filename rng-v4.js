/* CPython random.Random integer-seed compatible MT19937 (no external dependency). */
(function (global) {
  "use strict";
  class PythonRandom {
    constructor(seed = 0) {
      if (!Number.isSafeInteger(seed)) throw new Error("Seed must be a safe integer");
      let n = BigInt(Math.abs(seed)), words = [];
      do { words.push(Number(n & 0xffffffffn)); n >>= 32n; } while(n);
      this.mt = new Uint32Array(624); this.mt[0] = 19650218;
      for(let i=1;i<624;i++) this.mt[i]=(Math.imul(1812433253,this.mt[i-1]^(this.mt[i-1]>>>30))+i)>>>0;
      let i=1,j=0;
      for(let k=Math.max(624,words.length);k;k--) {
        this.mt[i]=((this.mt[i]^Math.imul(this.mt[i-1]^(this.mt[i-1]>>>30),1664525))+words[j]+j)>>>0;
        if(++i>=624){this.mt[0]=this.mt[623];i=1;} if(++j>=words.length)j=0;
      }
      for(let k=623;k;k--) {
        this.mt[i]=((this.mt[i]^Math.imul(this.mt[i-1]^(this.mt[i-1]>>>30),1566083941))-i)>>>0;
        if(++i>=624){this.mt[0]=this.mt[623];i=1;}
      }
      this.mt[0]=0x80000000;this.index=624;
    }
    uint32() {
      if(this.index>=624) {
        for(let i=0;i<624;i++) {
          const y=(this.mt[i]&0x80000000)|(this.mt[(i+1)%624]&0x7fffffff);
          this.mt[i]=this.mt[(i+397)%624]^(y>>>1)^((y&1)?0x9908b0df:0);
        }
        this.index=0;
      }
      let y=this.mt[this.index++];y^=y>>>11;y^=(y<<7)&0x9d2c5680;y^=(y<<15)&0xefc60000;y^=y>>>18;return y>>>0;
    }
    random(){return ((this.uint32()>>>5)*67108864+(this.uint32()>>>6))/9007199254740992;}
    getrandbits(k){if(k<1||k>32)throw new Error("Supported bits: 1..32");return this.uint32()>>>(32-k);}
    below(n){if(!Number.isSafeInteger(n)||n<1)throw new Error("Invalid random range");const k=Math.floor(Math.log2(n))+1;let r;do{r=this.getrandbits(k);}while(r>=n);return r;}
    randint(a,b){return a+this.below(b-a+1);}
    choice(xs){if(!xs.length)throw new Error("Empty population");return xs[this.below(xs.length)];}
    shuffle(xs){for(let i=xs.length-1;i>0;i--){const j=this.below(i+1);[xs[i],xs[j]]=[xs[j],xs[i]];}return xs;}
    sample(xs,k) {
      const n=xs.length;if(k<0||k>n)throw new Error("Invalid sample");
      let setsize=21;if(k>5)setsize+=4**Math.ceil(Math.log(k*3)/Math.log(4));
      const out=[];
      if(n<=setsize){const pool=[...xs];for(let i=0;i<k;i++){const j=this.below(n-i);out.push(pool[j]);pool[j]=pool[n-i-1];}}
      else{const selected=new Set();for(let i=0;i<k;i++){let j;do{j=this.below(n);}while(selected.has(j));selected.add(j);out.push(xs[j]);}}
      return out;
    }
    weighted(xs,weights) {
      const total=weights.reduce((a,b)=>a+b,0),x=this.random()*total;let cumulative=0;
      for(let i=0;i<xs.length-1;i++){cumulative+=weights[i];if(x<cumulative)return xs[i];}return xs.at(-1);
    }
  }
  function pyRound(x){const f=Math.floor(x),d=x-f;return d===0.5 ? f+(f%2===0?0:1) : Math.round(x);}
  const api={PythonRandom,pyRound};global.HMRng=api;if(typeof module!=="undefined")module.exports=api;
})(globalThis);

