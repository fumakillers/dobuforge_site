using System;
using System.IO;
using System.Text;

new DobuforgeBuilder().Build();
public class DobuforgeBuilder
{
    private readonly string partsSuffix = ".parts.html";
    private List<string> partsList = [
        "index",
        "contact",
        "mailform",
        "products"
    ];

    public void Build()
    {
        // directory
        var currentDir = Directory.GetCurrentDirectory();
        var repoRootDir = FindRepoRoot(currentDir);

        var developDirPath = Path.Combine(repoRootDir, ".develop");
        var partsDirPath = Path.Combine(developDirPath, "parts");

        foreach (var file in partsList)
        {
            var partsPath = Path.Combine(partsDirPath, file + partsSuffix);
            var headPath = string.Empty;
            if (file == "mailform" || file == "contact")
            {
                headPath = Path.Combine(partsDirPath, "head_mail" + partsSuffix);
            }
            else
            {
                headPath = Path.Combine(partsDirPath, "head" + partsSuffix);
            }
            var outputFilePath = Path.Combine(repoRootDir, file + ".html");

            // replace
            var html = File.ReadAllText(partsPath, Encoding.UTF8);
            var head = File.ReadAllText(headPath, Encoding.UTF8);
            var merged = html.Replace("{{head}}", head);
            // write
            File.WriteAllText(outputFilePath, merged, Encoding.UTF8);
            Console.WriteLine($"new file:{outputFilePath}");
        }
    }

    private string FindRepoRoot(string startDir)
    {
        var dir = new DirectoryInfo(startDir);

        while (dir != null)
        {
            var developDir = Path.Combine(dir.FullName, ".develop");
            var partsDir = Path.Combine(developDir, "parts");

            if (Directory.Exists(developDir) && Directory.Exists(partsDir))
            {
                return dir.FullName; // ここが基準dir（= .developの1個上）
            }

            dir = dir.Parent;
        }
        throw new DirectoryNotFoundException("基準dirが見つからないよ…（.develop/parts が見当たらない）");
    }
}
