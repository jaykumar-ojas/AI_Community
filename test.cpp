#include<bits/stdc++.h>
using namespace std;

#define long long int;

void solve(int n,int m,int k){
    int num =k/n;
    if(k%n){
        num++;
    }
    find(num,m);

}

signed main(){
    int t;
    cin>>t;
    
    while(t--){
        int n,m,k;
        cin>>n>>m>>k;

        solve(n,m,k);
    }
}