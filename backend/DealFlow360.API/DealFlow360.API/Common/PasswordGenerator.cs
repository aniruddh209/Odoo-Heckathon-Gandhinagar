using System.Security.Cryptography;
using System.Text;

namespace DealFlow360.API.Common;

public static class PasswordGenerator
{
    private const string Upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude I, O
    private const string Lower = "abcdefghijkmnopqrstuvwxyz"; // Exclude l
    private const string Digits = "23456789";                 // Exclude 0, 1
    private const string Special = "!@#$%^&*()-_=+";

    public static string Generate(int length = 14)
    {
        if (length < 8) length = 8;

        var allChars = Upper + Lower + Digits + Special;
        var chars = new char[length];

        // Ensure at least 2 of each required category
        chars[0] = GetRandomChar(Upper);
        chars[1] = GetRandomChar(Upper);
        chars[2] = GetRandomChar(Lower);
        chars[3] = GetRandomChar(Lower);
        chars[4] = GetRandomChar(Digits);
        chars[5] = GetRandomChar(Digits);
        chars[6] = GetRandomChar(Special);
        chars[7] = GetRandomChar(Special);

        // Fill remaining from entire pool
        for (int i = 8; i < length; i++)
        {
            chars[i] = GetRandomChar(allChars);
        }

        // Cryptographically shuffle the array
        Shuffle(chars);

        return new string(chars);
    }

    private static char GetRandomChar(string charPool)
    {
        var randomIndex = RandomNumberGenerator.GetInt32(0, charPool.Length);
        return charPool[randomIndex];
    }

    private static void Shuffle<T>(T[] array)
    {
        int n = array.Length;
        while (n > 1)
        {
            int k = RandomNumberGenerator.GetInt32(0, n);
            n--;
            (array[n], array[k]) = (array[k], array[n]);
        }
    }
}
