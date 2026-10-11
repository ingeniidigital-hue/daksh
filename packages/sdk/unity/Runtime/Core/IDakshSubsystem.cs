namespace Daksh.SDK
{
    /// <summary>
    /// Contract implemented by all modular Daksh subsystems.
    /// Enables decoupled registration, lifecycle management, and optional module inclusion.
    /// </summary>
    public interface IDakshSubsystem
    {
        string SubsystemName { get; }
        void Initialize(DakshClient client);
        void Shutdown();
    }
}
