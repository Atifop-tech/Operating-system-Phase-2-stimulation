#include <iostream>
#include <fstream>
#include <cstring>
#include <cstdlib>
using namespace std;

// MEMORY
char M[100][4];
char IR[4];
char R[4];
int IC;

// INTERRUPTS
int SI, PI, TI;

// PCB
int TTL, TLL;
int TTC, LLC;

// BUFFER
char buffer[40];

ifstream fin;
ofstream fout;

// ---------------- INIT ----------------
void INIT() {
    for(int i=0;i<100;i++)
        for(int j=0;j<4;j++)
            M[i][j] = ' ';

    IC = 0;
    SI = PI = TI = 0;
    TTC = LLC = 0;
}

// ---------------- MOS ----------------
void MOS() {

    if(TI == 0) {

        if(SI == 1) { // GD
            if(!fin.getline(buffer,40)) {
                fout << "OUT OF DATA\n";
                return;
            }

            int len = strlen(buffer);
            if(len > 0 && buffer[len-1] == '\r') buffer[len-1] = '\0';

            int addr = (IR[2]-'0')*10 + (IR[3]-'0');
            int k = 0;

            for(int i=0;i<10;i++) {
                for(int j=0;j<4;j++) {
                    if(buffer[k] != '\0')
                        M[addr+i][j] = buffer[k++];
                    else
                        M[addr+i][j] = ' ';
                }
            }
        }

        else if(SI == 2) { // PD
            int addr = (IR[2]-'0')*10 + (IR[3]-'0');

            for(int i=0;i<10;i++) {
                for(int j=0;j<4;j++)
                    fout << M[addr+i][j];
            }
            fout << endl;

            LLC++;
            if(LLC > TLL) {
                fout << "LINE LIMIT EXCEEDED\n";
                return;
            }
        }

        else if(SI == 3) { // H
            fout << "NORMAL TERMINATION\n\n";
            return;
        }

        if(PI == 1) {
            fout << "OPCODE ERROR\n";
            return;
        }

        if(PI == 2) {
            fout << "OPERAND ERROR\n";
            return;
        }
    }

    else { // TIME INTERRUPT

        if(SI == 1 || SI == 2) {
            fout << "TIME LIMIT EXCEEDED\n";
        }
        else if(SI == 3) {
            fout << "NORMAL TERMINATION\n";
        }
        else {
            fout << "TIME LIMIT EXCEEDED\n";
        }
    }

    SI = PI = TI = 0;
}

// ---------------- EXECUTE ----------------
void EXECUTE() {

    while(true) {

        // FETCH
        for(int i=0;i<4;i++)
            IR[i] = M[IC][i];
        IC++;

        // HALT CHECK
        if(IR[0]=='H') {
            SI = 3;
            MOS();
            break;
        }

        // VALID OPCODE
        if(!((IR[0]=='G' && IR[1]=='D') ||
             (IR[0]=='P' && IR[1]=='D') ||
             (IR[0]=='L' && IR[1]=='R') ||
             (IR[0]=='S' && IR[1]=='R') ||
             (IR[0]=='A' && IR[1]=='D') ||
             (IR[0]=='S' && IR[1]=='B') ||
             (IR[0]=='C' && IR[1]=='R') ||
             (IR[0]=='B' && IR[1]=='T'))) {
            PI = 1;
            MOS();
            break;
        }

        // VALID OPERAND
        if(!isdigit(IR[2]) || !isdigit(IR[3])) {
            PI = 2;
            MOS();
            break;
        }

        int addr = (IR[2]-'0')*10 + (IR[3]-'0');

        // EXECUTE
        if(IR[0]=='G' && IR[1]=='D') {
            SI = 1;
            MOS();
        }
        else if(IR[0]=='P' && IR[1]=='D') {
            SI = 2;
            MOS();
        }
        else if(IR[0]=='L' && IR[1]=='R') {
            for(int i=0;i<4;i++) R[i] = M[addr][i];
        }
        else if(IR[0]=='S' && IR[1]=='R') {
            for(int i=0;i<4;i++) M[addr][i] = R[i];
        }
        else if(IR[0]=='A' && IR[1]=='D') {
            char temp1[5], temp2[5];
            for(int i=0;i<4;i++) { temp1[i]=R[i]; temp2[i]=M[addr][i]; }
            temp1[4]='\0'; temp2[4]='\0';
            int res = atoi(temp1) + atoi(temp2);
            sprintf(temp1, "%04d", res);
            for(int i=0;i<4;i++) R[i] = temp1[i];
        }
        else if(IR[0]=='S' && IR[1]=='B') {
            char temp1[5], temp2[5];
            for(int i=0;i<4;i++) { temp1[i]=R[i]; temp2[i]=M[addr][i]; }
            temp1[4]='\0'; temp2[4]='\0';
            int res = atoi(temp1) - atoi(temp2);
            sprintf(temp1, "%04d", res);
            for(int i=0;i<4;i++) R[i] = temp1[i];
        }

        // TIME COUNTER
        TTC++;
        if(TTC > TTL) {
            TI = 2;
            MOS();
            break;
        }
    }
}

// ---------------- LOAD ----------------
void LOAD() {

    int m = 0;

    while(fin.getline(buffer,40)) {

        int len = strlen(buffer);
        if(len > 0 && buffer[len-1] == '\r') buffer[len-1] = '\0';

        if(strncmp(buffer,"$AMJ",4)==0) {
            INIT();
            sscanf(buffer+4,"%d %d",&TTL,&TLL);
        }

        else if(strncmp(buffer,"$DTA",4)==0) {
            IC = 0;
            return;
        }

        else if(strncmp(buffer,"$END",4)==0) {
            return;
        }

        else {
            int k = 0;

            while(buffer[k] != '\0') {
                for(int i=0;i<4;i++) {
                    if(buffer[k] != '\0')
                        M[m][i] = buffer[k++];
                    else
                        M[m][i] = ' ';
                }
                m++;
            }
        }
    }
}

// ---------------- MAIN ----------------
int main() {

    fin.open("input.txt");
    fout.open("output.txt");

    if(!fin) {
        cout<<"Input file not found\n";
        return 0;
    }

    // Check if the file is empty
    if(fin.peek() == std::ifstream::traits_type::eof()) {
        fout << "EMPTY INPUT FILE\n";
        cout << "Phase 2 Execution Completed (Empty File)\n";
        fin.close();
        fout.close();
        return 0;
    }

    while(!fin.eof()) {
        LOAD();
        EXECUTE();
    }

    fin.close();
    fout.close();

    cout<<"Phase 2 Execution Completed\n";
    return 0;
}